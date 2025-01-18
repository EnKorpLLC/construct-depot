import { PrismaClient } from '@prisma/client';
import stringSimilarity from 'string-similarity';

interface ProductData {
  name: string;
  description?: string;
  price: number;
}

export class ProductMatcher {
  private prisma: PrismaClient;
  private similarityThreshold: number = 0.8;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findMatch(productData: ProductData) {
    try {
      // Get all products with similar names
      const products = await this.prisma.product.findMany({
        where: {
          name: {
            contains: this.getSearchKeywords(productData.name),
            mode: 'insensitive',
          },
        },
      });

      if (products.length === 0) {
        return null;
      }

      // Find the best match using string similarity
      const matches = products.map(product => ({
        product,
        similarity: this.calculateSimilarity(product, productData),
      }));

      // Sort by similarity score
      matches.sort((a, b) => b.similarity - a.similarity);

      // Return the best match if it meets the threshold
      return matches[0].similarity >= this.similarityThreshold
        ? matches[0].product
        : null;
    } catch (error) {
      console.error('Error finding product match:', error);
      throw error;
    }
  }

  private calculateSimilarity(
    existingProduct: any,
    newProduct: ProductData
  ): number {
    // Calculate name similarity
    const nameSimilarity = stringSimilarity.compareTwoStrings(
      existingProduct.name.toLowerCase(),
      newProduct.name.toLowerCase()
    );

    // Calculate description similarity if available
    let descriptionSimilarity = 0;
    if (existingProduct.description && newProduct.description) {
      descriptionSimilarity = stringSimilarity.compareTwoStrings(
        existingProduct.description.toLowerCase(),
        newProduct.description.toLowerCase()
      );
    }

    // Calculate price similarity (within 10% range)
    const priceDifference = Math.abs(existingProduct.price - newProduct.price);
    const priceThreshold = existingProduct.price * 0.1; // 10% threshold
    const priceSimilarity = priceDifference <= priceThreshold ? 1 : 0;

    // Weight the different factors
    const weights = {
      name: 0.6,
      description: 0.2,
      price: 0.2,
    };

    // Calculate weighted average
    return (
      nameSimilarity * weights.name +
      descriptionSimilarity * weights.description +
      priceSimilarity * weights.price
    );
  }

  private getSearchKeywords(name: string): string {
    // Remove common words and special characters
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    return name
      .toLowerCase()
      .split(' ')
      .filter(word => !commonWords.includes(word))
      .join(' ');
  }

  setSimilarityThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Similarity threshold must be between 0 and 1');
    }
    this.similarityThreshold = threshold;
  }

  async findSimilarProducts(
    productData: ProductData,
    limit: number = 5
  ) {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          name: {
            contains: this.getSearchKeywords(productData.name),
            mode: 'insensitive',
          },
        },
      });

      const matches = products
        .map(product => ({
          product,
          similarity: this.calculateSimilarity(product, productData),
        }))
        .filter(match => match.similarity > 0.5) // Minimum similarity threshold
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return matches.map(match => ({
        ...match.product,
        similarityScore: match.similarity,
      }));
    } catch (error) {
      console.error('Error finding similar products:', error);
      throw error;
    }
  }
} 