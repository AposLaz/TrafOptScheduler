module.exports = {
  preset: 'ts-jest', // Use ts-jest to transform TypeScript files
  testEnvironment: 'node', // Set the test environment to Node.js
  transform: {
    '^.+\\.tsx?$': 'ts-jest', // Transform TypeScript files
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'], // Recognize TypeScript extensions
  transformIgnorePatterns: ['node_modules/(?!@babel/runtime)'], // Ensure node_modules are handled properly
};
