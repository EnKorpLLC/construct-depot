-- Add indexes to existing tables
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

CREATE INDEX IF NOT EXISTS "Product_name_idx" ON "Product"("name");
CREATE INDEX IF NOT EXISTS "Product_categories_idx" ON "Product" USING GIN ("categories");
CREATE INDEX IF NOT EXISTS "Product_supplierId_idx" ON "Product"("supplierId");
CREATE INDEX IF NOT EXISTS "Product_isActive_idx" ON "Product"("isActive");
CREATE INDEX IF NOT EXISTS "Product_inventoryStatus_idx" ON "Product"("inventoryStatus");
CREATE INDEX IF NOT EXISTS "Product_currentStock_idx" ON "Product"("currentStock");
CREATE INDEX IF NOT EXISTS "Product_price_idx" ON "Product"("price");
CREATE INDEX IF NOT EXISTS "Product_createdAt_idx" ON "Product"("createdAt");

CREATE INDEX IF NOT EXISTS "InventoryLog_productId_idx" ON "InventoryLog"("productId");
CREATE INDEX IF NOT EXISTS "InventoryLog_type_idx" ON "InventoryLog"("type");
CREATE INDEX IF NOT EXISTS "InventoryLog_createdAt_idx" ON "InventoryLog"("createdAt");
CREATE INDEX IF NOT EXISTS "InventoryLog_createdBy_idx" ON "InventoryLog"("createdBy");

CREATE INDEX IF NOT EXISTS "ActivityLog_type_idx" ON "ActivityLog"("type");
CREATE INDEX IF NOT EXISTS "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- Create ProductSearch table
CREATE TABLE IF NOT EXISTS "ProductSearch" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "searchText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSearch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductSearch_searchText_createdAt_idx" ON "ProductSearch"("searchText", "createdAt");

-- Create ProductStats table
CREATE TABLE IF NOT EXISTS "ProductStats" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductStats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductStats_productId_key" ON "ProductStats"("productId");
CREATE INDEX "ProductStats_totalSales_idx" ON "ProductStats"("totalSales");
CREATE INDEX "ProductStats_averageRating_idx" ON "ProductStats"("averageRating");
CREATE INDEX "ProductStats_viewCount_idx" ON "ProductStats"("viewCount");

-- Create RateLimit table
CREATE TABLE IF NOT EXISTS "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "expire" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");
CREATE INDEX "RateLimit_key_expire_idx" ON "RateLimit"("key", "expire");

-- Create trigger for product updates
CREATE OR REPLACE FUNCTION trigger_product_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update search text
    INSERT INTO "ProductSearch" ("id", "productId", "searchText")
    VALUES (
        gen_random_uuid()::text,
        NEW.id,
        lower(NEW.name || ' ' || NEW.description || ' ' || array_to_string(NEW.categories, ' '))
    );
    
    -- Update product stats
    INSERT INTO "ProductStats" ("id", "productId")
    VALUES (gen_random_uuid()::text, NEW.id)
    ON CONFLICT ("productId") DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_update_trigger
    AFTER INSERT OR UPDATE ON "Product"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_product_update();

-- Create trigger for inventory updates
CREATE OR REPLACE FUNCTION trigger_inventory_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product stats
    UPDATE "Product"
    SET "inventoryStatus" = 
        CASE 
            WHEN NEW."currentStock" <= 0 THEN 'OUT_OF_STOCK'
            WHEN NEW."currentStock" <= "lowStockThreshold" THEN 'LOW_STOCK'
            ELSE 'IN_STOCK'
        END
    WHERE id = NEW."productId";
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_update_trigger
    AFTER INSERT ON "InventoryLog"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_inventory_update();

-- Create function to clean old activity logs
CREATE OR REPLACE FUNCTION clean_old_activity_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM "ActivityLog"
    WHERE "createdAt" < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean old activity logs (requires pg_cron extension)
-- SELECT cron.schedule('0 0 * * *', $$SELECT clean_old_activity_logs()$$); 