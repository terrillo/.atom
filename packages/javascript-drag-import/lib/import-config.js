
const quoteEnum = [
  { value: true, description: 'Single quotes' },
  { value: false, description: 'Double quotes' }
];

const javascriptEnum = [
  { value: 0, description: 'import  from "";' },
  { value: 1, description: 'import {  } from "";' },
  { value: 2, description: 'import {  as  } from "";' },
  { value: 3, description: 'import {  as name } from "";' },
  { value: 4, description: 'import * as  from "";' },
  { value: 5, description: 'import * as name from "";' },
  { value: 6, description: 'import "";' },
  { value: 7, description: 'var  = require("");' },
  { value: 8, description: 'const  = require("");' },
  { value: 9, description: 'var name = require("");' },
  { value: 10, description: 'const name = require("");' },
  { value: 11, description: 'var  = import("");' },
  { value: 12, description: 'const  = import("");' },
  { value: 13, description: 'var name = import("");' },
  { value: 14, description: 'const name = import("");' }
];

const javascriptXEnum = [
  { value: 0, description: 'import  from "";' },
  { value: 1, description: 'import {  } from "";' },
  { value: 2, description: 'import {  as  } from "";' },
  { value: 3, description: 'import {  as name } from "";' },
  { value: 4, description: 'import * as  from "";' },
  { value: 5, description: 'import * as name from "";' },
  { value: 6, description: 'import "";' },
  { value: 7, description: 'var  = require("");' },
  { value: 8, description: 'const  = require("");' },
  { value: 9, description: 'var name = require("");' },
  { value: 10, description: 'const name = require("");' },
  { value: 11, description: 'var  = import("");' },
  { value: 12, description: 'const  = import("");' },
  { value: 13, description: 'var name = import("");' },
  { value: 14, description: 'const name = import("");' }
];

const typescriptEnum = [
  { value: 0, description: 'import  from "";' },
  { value: 1, description: 'import {  } from "";' },
  { value: 2, description: 'import {  as  } from "";' },
  { value: 3, description: 'import * as  from "";' },
  { value: 4, description: 'import "";' }
];

const typescriptXEnum = [
  { value: 0, description: 'import  from "";' },
  { value: 1, description: 'import {  } from "";' },
  { value: 2, description: 'import {  as  } from "";' },
  { value: 3, description: 'import * as  from "";' },
  { value: 4, description: 'import "";' }
];

const cssEnum = [
  { value: 0, description: '@import "";' },
  { value: 1, description: '@import url("");' }
];

const scssSassEnum = [
  { value: 0, description: '@import "";' },
  { value: 1, description: '@import url("");' },
  { value: 2, description: '@use "";' }
];

const lessEnum = [
  { value: 0, description: '@import "";' },
  { value: 1, description: '@import () "";' }
];

module.exports = {
  quoteEnum,
  javascriptEnum, typescriptEnum, javascriptXEnum, typescriptXEnum,
  cssEnum, scssSassEnum, lessEnum
}
