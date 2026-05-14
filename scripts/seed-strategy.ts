import { prisma } from '../src/database';
import { buildScenarioSeedData } from '../src/services/strategy-service';

async function main() {
  const scenarios = buildScenarioSeedData();

  for (const scenario of scenarios) {
    await prisma.strategyScenario.upsert({
      where: {
        playerCards_dealerUpcard_isSoft_isPair: {
          playerCards: scenario.playerCards,
          dealerUpcard: scenario.dealerUpcard,
          isSoft: scenario.isSoft,
          isPair: scenario.isPair,
        },
      },
      create: scenario,
      update: {
        playerTotal: scenario.playerTotal,
        correctAction: scenario.correctAction,
        difficulty: scenario.difficulty,
      },
    });
  }

  console.log(`Seeded ${scenarios.length} strategy scenarios`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
