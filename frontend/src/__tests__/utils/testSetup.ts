import { TestQuarantine } from './testQuarantine';

module.exports = async () => {
  const quarantine = new TestQuarantine(process.cwd());
  
  // Add a global hook to skip quarantined tests
  global.beforeEach(async () => {
    const testPath = expect.getState().testPath;
    const testName = expect.getState().currentTestName;

    if (quarantine.shouldSkipTest(testPath, testName)) {
      console.warn(`⚠️ Skipping quarantined test: ${testName}`);
      test.skip();
    }
  });

  // Add custom matchers for quarantine management
  expect.extend({
    toBeQuarantined(received) {
      const testPath = expect.getState().testPath;
      const testName = expect.getState().currentTestName;
      const isQuarantined = quarantine.shouldSkipTest(testPath, testName);

      return {
        pass: isQuarantined,
        message: () =>
          isQuarantined
            ? `Expected test not to be quarantined`
            : `Expected test to be quarantined`,
      };
    },
  });

  // Add global helper functions
  global.quarantineTest = (testPath: string, testName: string) => {
    quarantine.quarantineTest(testPath, testName);
  };

  global.removeFromQuarantine = (testPath: string, testName: string) => {
    quarantine.removeFromQuarantine(testPath, testName);
  };

  // Generate initial report
  quarantine.saveReport();
}; 