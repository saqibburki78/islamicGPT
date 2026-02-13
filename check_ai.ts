import * as ai from 'ai';
console.log('Exports from ai:', Object.keys(ai));
console.log('Has convertToCoreMessages:', 'convertToCoreMessages' in ai);
console.log('Has convertToModelMessages:', 'convertToModelMessages' in ai);
