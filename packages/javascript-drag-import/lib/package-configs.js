const {
  quoteEnum,
  javascriptEnum, javascriptXEnum, typescriptEnum, typescriptXEnum,
  cssEnum, scssSassEnum, lessEnum
} = require('./import-config');

class ConfigRetrieval {

  constructor() {}

  get importQuote() {    return atom.config.get('javascript-drag-import.preferences.importQuote') }
  get importPosition() { return atom.config.get('javascript-drag-import.preferences.importPosition') }
  get importCursor() {   return atom.config.get('javascript-drag-import.preferences.importCursor') }
  get addSemicolon() {   return atom.config.get('javascript-drag-import.preferences.addSemicolon') }
  get disableNotifs() {  return atom.config.get('javascript-drag-import.preferences.disableNotifs') }
  get closeAllNotif() {  return atom.config.get('javascript-drag-import.preferences.closeAllNotif') }
  get jsSupport() {      return atom.config.get('javascript-drag-import.import statements.javascript.jsSupport') }
  get jsxSupport() {     return atom.config.get('javascript-drag-import.import statements.javascript.jsxSupport') }
  get jsExtname() {      return atom.config.get('javascript-drag-import.import statements.javascript.withExtnameJS') }
  get tsSupport() {      return atom.config.get('javascript-drag-import.import statements.typescript.tsSupport') }
  get tsxSupport() {     return atom.config.get('javascript-drag-import.import statements.typescript.tsxSupport') }
  get tsExtname() {      return atom.config.get('javascript-drag-import.import statements.typescript.withExtnameTS') }
  get addExportName() {  return atom.config.get('javascript-drag-import.import statements.typescript.addExportName') }
  get cssSupport() {     return atom.config.get('javascript-drag-import.import statements.stylesheet.cssSupport') }
  get scssSupport() {    return atom.config.get('javascript-drag-import.import statements.stylesheet.scssSupport') }
  get lessSupport() {    return atom.config.get('javascript-drag-import.import statements.stylesheet.lessSupport') }
  get cssExtname() {     return atom.config.get('javascript-drag-import.import statements.stylesheet.withExtnameCSS') }

}

const settingsConfig = {
  preferences: {
    type: 'object',
    order: 1,
    properties: {
      importQuote: {
        order: 1,
        title: 'Quote style',
        description: 'Select a quote style for import path.',
        type: 'boolean',
        default: true,
        enum: quoteEnum
      },
      importPosition: {
        order: 2,
        title: 'Import position',
        description: "Append import statements at the bottom of the list.",
        type: 'boolean',
        default: true
      },
      importCursor: {
        order: 3,
        title: 'Import on mouse cursor',
        description: "Append import on selected line.",
        type: 'boolean',
        default: false
      },
      addSemicolon: {
        order: 4,
        title: 'Semicolon',
        description: "Add semicolon at the end of import statement.",
        type: 'boolean',
        default: true
      },
      disableNotifs: {
        order: 5,
        title: 'Disable all notifications',
        description: 'Disable all notifications on file drop to active pane. ',
        type: 'boolean',
        default: false
      },
      closeAllNotif: {
        order: 6,
        title: 'Close all notifications on ESC',
        description: "Close all active notifications on Escape keydown",
        type: 'boolean',
        default: false
      }
    }
  },
  "import statements": {
    type: 'object',
    order: 2,
    properties: {
      javascript: {
        title: ".js / .jsx",
        order: 1,
        type: 'object',
        properties: {
          jsSupport: {
            order: 1,
            title: 'Javascript import style',
            description: '',
            type: 'integer',
            default: 1,
            enum: javascriptEnum
          },
          jsxSupport: {
            order: 2,
            title: 'JSX import style',
            description: '',
            type: 'integer',
            default: 1,
            enum: javascriptXEnum
          },
          withExtnameJS: {
            order: 3,
            title: 'File type',
            description: 'Add file type or extension name at the end of path. _{ex. \'../path.js\'}_',
            type: 'boolean',
            default: false
          }
        }
      },
      typescript: {
        title: ".ts / .tsx",
        order: 2,
        type: 'object',
        properties: {
          tsSupport: {
            order: 1,
            title: 'Typescript import style',
            description: '',
            type: 'integer',
            default: 1,
            enum: typescriptEnum
          },
          tsxSupport: {
            order: 2,
            title: 'TSX import style',
            description: '',
            type: 'integer',
            default: 1,
            enum: typescriptXEnum
          },
          withExtnameTS: {
            order: 3,
            title: 'File type',
            description: 'Add file type or extension name at the end of path. _{ex. \'../path.ts\'}_',
            type: 'boolean',
            default: false
          },
          addExportName: {
            order: 4,
            title: 'Export name',
            description: 'Include component name in import statement. (Angular)<br/>*same behaviour applies in .tsx files.*',
            type: 'boolean',
            default: true
          }
        }
      },
      stylesheet: {
        title: ".css / .scss / .sass / .less",
        order: 3,
        type: 'object',
        properties: {
          cssSupport: {
            order: 1,
            title: 'CSS import style',
            description: '',
            type: 'integer',
            default: 0,
            enum: cssEnum
          },
          scssSupport: {
            order: 2,
            title: 'SCSS/SASS import style',
            description: '',
            type: 'integer',
            default: 0,
            enum: scssSassEnum
          },
          lessSupport: {
            order: 3,
            title: 'LESS import style',
            description: '',
            type: 'integer',
            default: 0,
            enum: lessEnum
          },
          withExtnameCSS: {
            order: 4,
            title: 'File type',
            description: 'Add file type or extension name at the end of path. _{ex. \'../path.css\'}_',
            type: 'boolean',
            default: false
          }
        }
      }
    }
  }
};

module.exports = {
  retrieval: new ConfigRetrieval(),
  registrar: settingsConfig
};
