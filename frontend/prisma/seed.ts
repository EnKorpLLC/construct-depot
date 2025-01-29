import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stateTaxRates = [
  { state: 'Alabama', stateCode: 'AL', rate: 0.0400 },
  { state: 'Alaska', stateCode: 'AK', rate: 0.0000 },
  { state: 'Arizona', stateCode: 'AZ', rate: 0.0560 },
  { state: 'Arkansas', stateCode: 'AR', rate: 0.0650 },
  { state: 'California', stateCode: 'CA', rate: 0.0725 },
  { state: 'Colorado', stateCode: 'CO', rate: 0.0290 },
  { state: 'Connecticut', stateCode: 'CT', rate: 0.0635 },
  { state: 'Delaware', stateCode: 'DE', rate: 0.0000 },
  { state: 'Florida', stateCode: 'FL', rate: 0.0600 },
  { state: 'Georgia', stateCode: 'GA', rate: 0.0400 },
  { state: 'Hawaii', stateCode: 'HI', rate: 0.0400 },
  { state: 'Idaho', stateCode: 'ID', rate: 0.0600 },
  { state: 'Illinois', stateCode: 'IL', rate: 0.0625 },
  { state: 'Indiana', stateCode: 'IN', rate: 0.0700 },
  { state: 'Iowa', stateCode: 'IA', rate: 0.0600 },
  { state: 'Kansas', stateCode: 'KS', rate: 0.0650 },
  { state: 'Kentucky', stateCode: 'KY', rate: 0.0600 },
  { state: 'Louisiana', stateCode: 'LA', rate: 0.0445 },
  { state: 'Maine', stateCode: 'ME', rate: 0.0550 },
  { state: 'Maryland', stateCode: 'MD', rate: 0.0600 },
  { state: 'Massachusetts', stateCode: 'MA', rate: 0.0625 },
  { state: 'Michigan', stateCode: 'MI', rate: 0.0600 },
  { state: 'Minnesota', stateCode: 'MN', rate: 0.0688 },
  { state: 'Mississippi', stateCode: 'MS', rate: 0.0700 },
  { state: 'Missouri', stateCode: 'MO', rate: 0.0425 },
  { state: 'Montana', stateCode: 'MT', rate: 0.0000 },
  { state: 'Nebraska', stateCode: 'NE', rate: 0.0550 },
  { state: 'Nevada', stateCode: 'NV', rate: 0.0685 },
  { state: 'New Hampshire', stateCode: 'NH', rate: 0.0000 },
  { state: 'New Jersey', stateCode: 'NJ', rate: 0.0625 },
  { state: 'New Mexico', stateCode: 'NM', rate: 0.0513 },
  { state: 'New York', stateCode: 'NY', rate: 0.0400 },
  { state: 'North Carolina', stateCode: 'NC', rate: 0.0475 },
  { state: 'North Dakota', stateCode: 'ND', rate: 0.0500 },
  { state: 'Ohio', stateCode: 'OH', rate: 0.0575 },
  { state: 'Oklahoma', stateCode: 'OK', rate: 0.0450 },
  { state: 'Oregon', stateCode: 'OR', rate: 0.0000 },
  { state: 'Pennsylvania', stateCode: 'PA', rate: 0.0600 },
  { state: 'Rhode Island', stateCode: 'RI', rate: 0.0700 },
  { state: 'South Carolina', stateCode: 'SC', rate: 0.0600 },
  { state: 'South Dakota', stateCode: 'SD', rate: 0.0450 },
  { state: 'Tennessee', stateCode: 'TN', rate: 0.0700 },
  { state: 'Texas', stateCode: 'TX', rate: 0.0625 },
  { state: 'Utah', stateCode: 'UT', rate: 0.0595 },
  { state: 'Vermont', stateCode: 'VT', rate: 0.0600 },
  { state: 'Virginia', stateCode: 'VA', rate: 0.0530 },
  { state: 'Washington', stateCode: 'WA', rate: 0.0650 },
  { state: 'West Virginia', stateCode: 'WV', rate: 0.0600 },
  { state: 'Wisconsin', stateCode: 'WI', rate: 0.0500 },
  { state: 'Wyoming', stateCode: 'WY', rate: 0.0400 },
  { state: 'District of Columbia', stateCode: 'DC', rate: 0.0600 },
];

async function main() {
  console.log('Start seeding state tax rates...');
  
  for (const taxRate of stateTaxRates) {
    await prisma.stateTaxRate.upsert({
      where: { stateCode: taxRate.stateCode },
      update: {
        rate: taxRate.rate,
        updatedAt: new Date(),
      },
      create: {
        state: taxRate.state,
        stateCode: taxRate.stateCode,
        rate: taxRate.rate,
        hasLocalTax: true, // Most states have some form of local tax
      },
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 