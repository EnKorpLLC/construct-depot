import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ProductCrawlerService } from '@/services/crawler/ProductCrawlerService';
import { CrawlerSecurity } from '@/middleware/crawler-security';

export async function POST(request: Request) {
  try {
    // Verify super admin access
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply security middleware
    const crawlerSecurity = CrawlerSecurity.getInstance();
    const securityCheck = await crawlerSecurity.middleware(request);
    if (securityCheck) return securityCheck;

    const body = await request.json();
    const { url, selectors, supplierId } = body;

    if (!url || !selectors || !supplierId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const crawlerService = new ProductCrawlerService();
    
    // Validate URL
    if (!await crawlerService.validateUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Crawl products
    const products = await crawlerService.crawlProducts(url, selectors, supplierId);
    
    return NextResponse.json({
      message: 'Crawl completed successfully',
      productsAdded: products.length,
      products
    });
  } catch (error) {
    console.error('Crawler API error:', error);
    return NextResponse.json(
      { error: 'Failed to process crawler request' },
      { status: 500 }
    );
  }
} 