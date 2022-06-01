// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';

var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};

var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : new P(function (resolve) {
        resolve(result.value);
      }).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const inversify_1 = require("inversify");

const vscode_1 = require("vscode");

const types_1 = require("../../../common/application/types");

require("../../../common/extensions");

const types_2 = require("../../../common/platform/types");

const types_3 = require("../../../common/types");

const contracts_1 = require("../../../interpreter/contracts");

const types_4 = require("../../../ioc/types");

const base_1 = require("../base");

const types_5 = require("../commands/types");

const constants_1 = require("../constants");

const promptHandler_1 = require("../promptHandler");

const types_6 = require("../types");

const messages = {
  [constants_1.DiagnosticCodes.NoPythonInterpretersDiagnostic]: 'Python is not installed. Please download and install Python before using the extension.',
  [constants_1.DiagnosticCodes.MacInterpreterSelectedAndHaveOtherInterpretersDiagnostic]: 'You have selected the macOS system install of Python, which is not recommended for use with the Python extension. Some functionality will be limited, please select a different interpreter.',
  [constants_1.DiagnosticCodes.MacInterpreterSelectedAndNoOtherInterpretersDiagnostic]: 'The macOS system install of Python is not recommended, some functionality in the extension will be limited. Install another version of Python for the best experience.'
};

class InvalidPythonInterpreterDiagnostic extends base_1.BaseDiagnostic {
  constructor(code) {
    super(code, messages[code], vscode_1.DiagnosticSeverity.Error, types_6.DiagnosticScope.WorkspaceFolder);
  }

}

exports.InvalidPythonInterpreterDiagnostic = InvalidPythonInterpreterDiagnostic;
exports.InvalidPythonInterpreterServiceId = 'InvalidPythonInterpreterServiceId';
let InvalidPythonInterpreterService = class InvalidPythonInterpreterService extends base_1.BaseDiagnosticsService {
  constructor(serviceContainer) {
    super([constants_1.DiagnosticCodes.NoPythonInterpretersDiagnostic, constants_1.DiagnosticCodes.MacInterpreterSelectedAndHaveOtherInterpretersDiagnostic, constants_1.DiagnosticCodes.MacInterpreterSelectedAndNoOtherInterpretersDiagnostic], serviceContainer);
    this.changeThrottleTimeout = 1000;
    this.addPythonPathChangedHandler();
  }

  diagnose() {
    return __awaiter(this, void 0, void 0, function* () {
      const configurationService = this.serviceContainer.get(types_3.IConfigurationService);
      const settings = configurationService.getSettings();

      if (settings.disableInstallationChecks === true) {
        return [];
      }

      const interpreterService = this.serviceContainer.get(contracts_1.IInterpreterService);
      const interpreters = yield interpreterService.getInterpreters();

      if (interpreters.length === 0) {
        return [new InvalidPythonInterpreterDiagnostic(constants_1.DiagnosticCodes.NoPythonInterpretersDiagnostic)];
      }

      const platform = this.serviceContainer.get(types_2.IPlatformService);

      if (!platform.isMac) {
        return [];
      }

      const helper = this.serviceContainer.get(contracts_1.IInterpreterHelper);

      if (!helper.isMacDefaultPythonPath(settings.pythonPath)) {
        return [];
      }

      const interpreter = yield interpreterService.getActiveInterpreter();

      if (!interpreter || interpreter.type !== contracts_1.InterpreterType.Unknown) {
        return [];
      }

      if (interpreters.filter(i => !helper.isMacDefaultPythonPath(i.path)).length === 0) {
        return [new InvalidPythonInterpreterDiagnostic(constants_1.DiagnosticCodes.MacInterpreterSelectedAndNoOtherInterpretersDiagnostic)];
      }

      return [new InvalidPythonInterpreterDiagnostic(constants_1.DiagnosticCodes.MacInterpreterSelectedAndHaveOtherInterpretersDiagnostic)];
    });
  }

  handle(diagnostics) {
    return __awaiter(this, void 0, void 0, function* () {
      if (diagnostics.length === 0) {
        return;
      }

      const messageService = this.serviceContainer.get(types_6.IDiagnosticHandlerService, promptHandler_1.DiagnosticCommandPromptHandlerServiceId);
      yield Promise.all(diagnostics.map(diagnostic => __awaiter(this, void 0, void 0, function* () {
        if (!this.canHandle(diagnostic)) {
          return;
        }

        const commandPrompts = this.getCommandPrompts(diagnostic);
        return messageService.handle(diagnostic, {
          commandPrompts,
          message: diagnostic.message
        });
      })));
    });
  }

  addPythonPathChangedHandler() {
    const workspaceService = this.serviceContainer.get(types_1.IWorkspaceService);
    const disposables = this.serviceContainer.get(types_3.IDisposableRegistry);
    disposables.push(workspaceService.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this)));
  }

  onDidChangeConfiguration(event) {
    return __awaiter(this, void 0, void 0, function* () {
      const workspaceService = this.serviceContainer.get(types_1.IWorkspaceService);
      const workspacesUris = workspaceService.hasWorkspaceFolders ? workspaceService.workspaceFolders.map(workspace => workspace.uri) : [undefined];

      if (workspacesUris.findIndex(uri => event.affectsConfiguration('python.pythonPath', uri)) === -1) {
        return;
      } // Lets wait, for more changes, dirty simple throttling.


      if (this.timeOut) {
        clearTimeout(this.timeOut);
        this.timeOut = undefined;
      }

      this.timeOut = setTimeout(() => {
        this.timeOut = undefined;
        this.diagnose().then(dianostics => this.handle(dianostics)).ignoreErrors();
      }, this.changeThrottleTimeout);
    });
  }

  getCommandPrompts(diagnostic) {
    const commandFactory = this.serviceContainer.get(types_5.IDiagnosticsCommandFactory);

    switch (diagnostic.code) {
      case constants_1.DiagnosticCodes.NoPythonInterpretersDiagnostic:
        {
          return [{
            prompt: 'Download',
            command: commandFactory.createCommand(diagnostic, {
              type: 'launch',
              options: 'https://www.python.org/downloads'
            })
          }];
        }

      case constants_1.DiagnosticCodes.MacInterpreterSelectedAndHaveOtherInterpretersDiagnostic:
        {
          return [{
            prompt: 'Select Python Interpreter',
            command: commandFactory.createCommand(diagnostic, {
              type: 'executeVSCCommand',
              options: 'python.setInterpreter'
            })
          }];
        }

      case constants_1.DiagnosticCodes.MacInterpreterSelectedAndNoOtherInterpretersDiagnostic:
        {
          return [{
            prompt: 'Learn more',
            command: commandFactory.createCommand(diagnostic, {
              type: 'launch',
              options: 'https://code.visualstudio.com/docs/python/python-tutorial#_prerequisites'
            })
          }, {
            prompt: 'Download',
            command: commandFactory.createCommand(diagnostic, {
              type: 'launch',
              options: 'https://www.python.org/downloads'
            })
          }];
        }

      default:
        {
          throw new Error('Invalid diagnostic for \'InvalidPythonInterpreterService\'');
        }
    }
  }

};
InvalidPythonInterpreterService = __decorate([inversify_1.injectable(), __param(0, inversify_1.inject(types_4.IServiceContainer))], InvalidPythonInterpreterService);
exports.InvalidPythonInterpreterService = InvalidPythonInterpreterService;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB5dGhvbkludGVycHJldGVyLmpzIl0sIm5hbWVzIjpbIl9fZGVjb3JhdGUiLCJkZWNvcmF0b3JzIiwidGFyZ2V0Iiwia2V5IiwiZGVzYyIsImMiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJyIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiZCIsIlJlZmxlY3QiLCJkZWNvcmF0ZSIsImkiLCJkZWZpbmVQcm9wZXJ0eSIsIl9fcGFyYW0iLCJwYXJhbUluZGV4IiwiZGVjb3JhdG9yIiwiX19hd2FpdGVyIiwidGhpc0FyZyIsIl9hcmd1bWVudHMiLCJQIiwiZ2VuZXJhdG9yIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJmdWxmaWxsZWQiLCJ2YWx1ZSIsInN0ZXAiLCJuZXh0IiwiZSIsInJlamVjdGVkIiwicmVzdWx0IiwiZG9uZSIsInRoZW4iLCJhcHBseSIsImV4cG9ydHMiLCJpbnZlcnNpZnlfMSIsInJlcXVpcmUiLCJ2c2NvZGVfMSIsInR5cGVzXzEiLCJ0eXBlc18yIiwidHlwZXNfMyIsImNvbnRyYWN0c18xIiwidHlwZXNfNCIsImJhc2VfMSIsInR5cGVzXzUiLCJjb25zdGFudHNfMSIsInByb21wdEhhbmRsZXJfMSIsInR5cGVzXzYiLCJtZXNzYWdlcyIsIkRpYWdub3N0aWNDb2RlcyIsIk5vUHl0aG9uSW50ZXJwcmV0ZXJzRGlhZ25vc3RpYyIsIk1hY0ludGVycHJldGVyU2VsZWN0ZWRBbmRIYXZlT3RoZXJJbnRlcnByZXRlcnNEaWFnbm9zdGljIiwiTWFjSW50ZXJwcmV0ZXJTZWxlY3RlZEFuZE5vT3RoZXJJbnRlcnByZXRlcnNEaWFnbm9zdGljIiwiSW52YWxpZFB5dGhvbkludGVycHJldGVyRGlhZ25vc3RpYyIsIkJhc2VEaWFnbm9zdGljIiwiY29uc3RydWN0b3IiLCJjb2RlIiwiRGlhZ25vc3RpY1NldmVyaXR5IiwiRXJyb3IiLCJEaWFnbm9zdGljU2NvcGUiLCJXb3Jrc3BhY2VGb2xkZXIiLCJJbnZhbGlkUHl0aG9uSW50ZXJwcmV0ZXJTZXJ2aWNlSWQiLCJJbnZhbGlkUHl0aG9uSW50ZXJwcmV0ZXJTZXJ2aWNlIiwiQmFzZURpYWdub3N0aWNzU2VydmljZSIsInNlcnZpY2VDb250YWluZXIiLCJjaGFuZ2VUaHJvdHRsZVRpbWVvdXQiLCJhZGRQeXRob25QYXRoQ2hhbmdlZEhhbmRsZXIiLCJkaWFnbm9zZSIsImNvbmZpZ3VyYXRpb25TZXJ2aWNlIiwiZ2V0IiwiSUNvbmZpZ3VyYXRpb25TZXJ2aWNlIiwic2V0dGluZ3MiLCJnZXRTZXR0aW5ncyIsImRpc2FibGVJbnN0YWxsYXRpb25DaGVja3MiLCJpbnRlcnByZXRlclNlcnZpY2UiLCJJSW50ZXJwcmV0ZXJTZXJ2aWNlIiwiaW50ZXJwcmV0ZXJzIiwiZ2V0SW50ZXJwcmV0ZXJzIiwicGxhdGZvcm0iLCJJUGxhdGZvcm1TZXJ2aWNlIiwiaXNNYWMiLCJoZWxwZXIiLCJJSW50ZXJwcmV0ZXJIZWxwZXIiLCJpc01hY0RlZmF1bHRQeXRob25QYXRoIiwicHl0aG9uUGF0aCIsImludGVycHJldGVyIiwiZ2V0QWN0aXZlSW50ZXJwcmV0ZXIiLCJ0eXBlIiwiSW50ZXJwcmV0ZXJUeXBlIiwiVW5rbm93biIsImZpbHRlciIsInBhdGgiLCJoYW5kbGUiLCJkaWFnbm9zdGljcyIsIm1lc3NhZ2VTZXJ2aWNlIiwiSURpYWdub3N0aWNIYW5kbGVyU2VydmljZSIsIkRpYWdub3N0aWNDb21tYW5kUHJvbXB0SGFuZGxlclNlcnZpY2VJZCIsImFsbCIsIm1hcCIsImRpYWdub3N0aWMiLCJjYW5IYW5kbGUiLCJjb21tYW5kUHJvbXB0cyIsImdldENvbW1hbmRQcm9tcHRzIiwibWVzc2FnZSIsIndvcmtzcGFjZVNlcnZpY2UiLCJJV29ya3NwYWNlU2VydmljZSIsImRpc3Bvc2FibGVzIiwiSURpc3Bvc2FibGVSZWdpc3RyeSIsInB1c2giLCJvbkRpZENoYW5nZUNvbmZpZ3VyYXRpb24iLCJiaW5kIiwiZXZlbnQiLCJ3b3Jrc3BhY2VzVXJpcyIsImhhc1dvcmtzcGFjZUZvbGRlcnMiLCJ3b3Jrc3BhY2VGb2xkZXJzIiwid29ya3NwYWNlIiwidXJpIiwidW5kZWZpbmVkIiwiZmluZEluZGV4IiwiYWZmZWN0c0NvbmZpZ3VyYXRpb24iLCJ0aW1lT3V0IiwiY2xlYXJUaW1lb3V0Iiwic2V0VGltZW91dCIsImRpYW5vc3RpY3MiLCJpZ25vcmVFcnJvcnMiLCJjb21tYW5kRmFjdG9yeSIsIklEaWFnbm9zdGljc0NvbW1hbmRGYWN0b3J5IiwicHJvbXB0IiwiY29tbWFuZCIsImNyZWF0ZUNvbW1hbmQiLCJvcHRpb25zIiwiaW5qZWN0YWJsZSIsImluamVjdCIsIklTZXJ2aWNlQ29udGFpbmVyIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7O0FBQ0EsSUFBSUEsVUFBVSxHQUFJLFVBQVEsU0FBS0EsVUFBZCxJQUE2QixVQUFVQyxVQUFWLEVBQXNCQyxNQUF0QixFQUE4QkMsR0FBOUIsRUFBbUNDLElBQW5DLEVBQXlDO0FBQ25GLE1BQUlDLENBQUMsR0FBR0MsU0FBUyxDQUFDQyxNQUFsQjtBQUFBLE1BQTBCQyxDQUFDLEdBQUdILENBQUMsR0FBRyxDQUFKLEdBQVFILE1BQVIsR0FBaUJFLElBQUksS0FBSyxJQUFULEdBQWdCQSxJQUFJLEdBQUdLLE1BQU0sQ0FBQ0Msd0JBQVAsQ0FBZ0NSLE1BQWhDLEVBQXdDQyxHQUF4QyxDQUF2QixHQUFzRUMsSUFBckg7QUFBQSxNQUEySE8sQ0FBM0g7QUFDQSxNQUFJLE9BQU9DLE9BQVAsS0FBbUIsUUFBbkIsSUFBK0IsT0FBT0EsT0FBTyxDQUFDQyxRQUFmLEtBQTRCLFVBQS9ELEVBQTJFTCxDQUFDLEdBQUdJLE9BQU8sQ0FBQ0MsUUFBUixDQUFpQlosVUFBakIsRUFBNkJDLE1BQTdCLEVBQXFDQyxHQUFyQyxFQUEwQ0MsSUFBMUMsQ0FBSixDQUEzRSxLQUNLLEtBQUssSUFBSVUsQ0FBQyxHQUFHYixVQUFVLENBQUNNLE1BQVgsR0FBb0IsQ0FBakMsRUFBb0NPLENBQUMsSUFBSSxDQUF6QyxFQUE0Q0EsQ0FBQyxFQUE3QyxFQUFpRCxJQUFJSCxD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RHlDLEVBRXpDdEgsT0FBTyxDQUFDLENBQUQsRUFBSXNCLFdBQVcsQ0FBQ2lHLE1BQVosQ0FBbUIxRixPQUFPLENBQUMyRixpQkFBM0IsQ0FBSixDQUZrQyxDQUFELEVBR3pDdkUsK0JBSHlDLENBQTVDO0FBSUE1QixPQUFPLENBQUM0QiwrQkFBUixHQUEwQ0EsK0JBQTFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG4ndXNlIHN0cmljdCc7XG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG52YXIgX19wYXJhbSA9ICh0aGlzICYmIHRoaXMuX19wYXJhbSkgfHwgZnVuY3Rpb24gKHBhcmFtSW5kZXgsIGRlY29yYXRvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHsgZGVjb3JhdG9yKHRhcmdldCwga2V5LCBwYXJhbUluZGV4KTsgfVxufTtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgaW52ZXJzaWZ5XzEgPSByZXF1aXJlKFwiaW52ZXJzaWZ5XCIpO1xuY29uc3QgdnNjb2RlXzEgPSByZXF1aXJlKFwidnNjb2RlXCIpO1xuY29uc3QgdHlwZXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9jb21tb24vYXBwbGljYXRpb24vdHlwZXNcIik7XG5yZXF1aXJlKFwiLi4vLi4vLi4vY29tbW9uL2V4dGVuc2lvbnNcIik7XG5jb25zdCB0eXBlc18yID0gcmVxdWlyZShcIi4uLy4uLy4uL2NvbW1vbi9wbGF0Zm9ybS90eXBlc1wiKTtcbmNvbnN0IHR5cGVzXzMgPSByZXF1aXJlKFwiLi4vLi4vLi4vY29tbW9uL3R5cGVzXCIpO1xuY29uc3QgY29udHJhY3RzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vaW50ZXJwcmV0ZXIvY29udHJhY3RzXCIpO1xuY29uc3QgdHlwZXNfNCA9IHJlcXVpcmUoXCIuLi8uLi8uLi9pb2MvdHlwZXNcIik7XG5jb25zdCBiYXNlXzEgPSByZXF1aXJlKFwiLi4vYmFzZVwiKTtcbmNvbnN0IHR5cGVzXzUgPSByZXF1aXJlKFwiLi4vY29tbWFuZHMvdHlwZXNcIik7XG5jb25zdCBjb25zdGFudHNfMSA9IHJlcXVpcmUoXCIuLi9jb25zdGFudHNcIik7XG5jb25zdCBwcm9tcHRIYW5kbGVyXzEgPSByZXF1aXJlKFwiLi4vcHJvbXB0SGFuZGxlclwiKTtcbmNvbnN0IHR5cGVzXzYgPSByZXF1aXJlKFwiLi4vdHlwZXNcIik7XG5jb25zdCBtZXNzYWdlcyA9IHtcbiAgICBbY29uc3RhbnRzXzEuRGlhZ25vc3RpY0NvZGVzLk5vUHl0aG9uSW50ZXJwcmV0ZXJzRGlhZ25vc3RpY106ICdQeXRob24gaXMgbm90IGluc3RhbGxlZC4gUGxlYXNlIGRvd25sb2FkIGFuZCBpbnN0YWxsIFB5dGhvbiBiZWZvcmUgdXNpbmcgdGhlIGV4dGVuc2lvbi4nLFxuICAgIFtjb25zdGFudHNfMS5EaWFnbm9zdGljQ29kZXMuTWFjSW50ZXJwcmV0ZXJTZWxlY3RlZEFuZEhhdmVPdGhlckludGVycHJldGVyc0RpYWdub3N0aWNdOiAnWW91IGhhdmUgc2VsZWN0ZWQgdGhlIG1hY09TIHN5c3RlbSBpbnN0YWxsIG9mIFB5dGhvbiwgd2hpY2ggaXMgbm90IHJlY29tbWVuZGVkIGZvciB1c2Ugd2l0aCB0aGUgUHl0aG9uIGV4dGVuc2lvbi4gU29tZSBmdW5jdGlvbmFsaXR5IHdpbGwgYmUgbGltaXRlZCwgcGxlYXNlIHNlbGVjdCBhIGRpZmZlcmVudCBpbnRlcnByZXRlci4nLFxuICAgIFtjb25zdGFudHNfMS5EaWFnbm9zdGljQ29kZXMuTWFjSW50ZXJwcmV0ZXJTZWxlY3RlZEFuZE5vT3RoZXJJbnRlcnByZXRlcnNEaWFnbm9zdGljXTogJ1RoZSBtYWNPUyBzeXN0ZW0gaW5zdGFsbCBvZiBQeXRob24gaXMgbm90IHJlY29tbWVuZGVkLCBzb21lIGZ1bmN0aW9uYWxpdHkgaW4gdGhlIGV4dGVuc2lvbiB3aWxsIGJlIGxpbWl0ZWQuIEluc3RhbGwgYW5vdGhlciB2ZXJzaW9uIG9mIFB5dGhvbiBmb3IgdGhlIGJlc3QgZXhwZXJpZW5jZS4nXG59O1xuY2xhc3MgSW52YWxpZFB5dGhvbkludGVycHJldGVyRGlhZ25vc3RpYyBleHRlbmRzIGJhc2VfMS5CYXNlRGlhZ25vc3RpYyB7XG4gICAgY29uc3RydWN0b3IoY29kZSkge1xuICAgICAgICBzdXBlcihjb2RlLCBtZXNzYWdlc1tjb2RlXSwgdnNjb2RlXzEuRGlhZ25vc3RpY1NldmVyaXR5LkVycm9yLCB0eXBlc182LkRpYWdub3N0aWNTY29wZS5Xb3Jrc3BhY2VGb2xkZXIpO1xuICAgIH1cbn1cbmV4cG9ydHMuSW52YWxpZFB5dGhvbkludGVycHJldGVyRGlhZ25vc3RpYyA9IEludmFsaWRQeXRob25JbnRlcnByZXRlckRpYWdub3N0aWM7XG5leHBvcnRzLkludmFsaWRQeXRob25JbnRlcnByZXRlclNlcnZpY2VJZCA9ICdJbnZhbGlkUHl0aG9uSW50ZXJwcmV0ZXJTZXJ2aWNlSWQnO1xubGV0IEludmFsaWRQeXRob25JbnRlcnByZXRlclNlcnZpY2UgPSBjbGFzcyBJbnZhbGlkUHl0aG9uSW50ZXJwcmV0ZXJTZXJ2aWNlIGV4dGVuZHMgYmFzZV8xLkJhc2VEaWFnbm9zdGljc1NlcnZpY2Uge1xuICAgIGNvbnN0cnVjdG9yKHNlcnZpY2VDb250YWluZXIpIHtcbiAgICAgICAgc3VwZXIoW2NvbnN0YW50c18xLkRpYWdub3N0aWNDb2Rlcy5Ob1B5dGhvbkludGVycHJldGVyc0RpYWdub3N0aWMsXG4gICAgICAgICAgICBjb25zdGFudHNfMS5EaWFnbm9zdGljQ29kZXMuTWFjSW50ZXJwcmV0ZXJTZWxlY3RlZEFuZEhhdmVPdGhlckludGVycHJldGVyc0RpYWdub3N0aWMsXG4gICAgICAgICAgICBjb25zdGFudHNfMS5EaWFnbm9zdGljQ29kZXMuTWFjSW50ZXJwcmV0ZXJTZWxlY3RlZEFuZE5vT3RoZXJJbnRlcnByZXRlcnNEaWFnbm9zdGljXSwgc2VydmljZUNvbnRhaW5lcik7XG4gICAgICAgIHRoaXMuY2hhbmdlVGhyb3R0bGVUaW1lb3V0ID0gMTAwMDtcbiAgICAgICAgdGhpcy5hZGRQeXRob25QYXRoQ2hhbmdlZEhhbmRsZXIoKTtcbiAgICB9XG4gICAgZGlhZ25vc2UoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWd1cmF0aW9uU2VydmljZSA9IHRoaXMuc2VydmljZUNvbnRhaW5lci5nZXQodHlwZXNfMy5JQ29uZmlndXJhdGlvblNlcnZpY2UpO1xuICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSBjb25maWd1cmF0aW9uU2VydmljZS5nZXRTZXR0aW5ncygpO1xuICAgICAgICAgICAgaWYgKHNldHRpbmdzLmRpc2FibGVJbnN0YWxsYXRpb25DaGVja3MgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBpbnRlcnByZXRlclNlcnZpY2UgPSB0aGlzLnNlcnZpY2VDb250YWluZXIuZ2V0KGNvbnRyYWN0c18xLklJbnRlcnByZXRlclNlcnZpY2UpO1xuICAgICAgICAgICAgY29uc3QgaW50ZXJwcmV0ZXJzID0geWllbGQgaW50ZXJwcmV0ZXJTZXJ2aWNlLmdldEludGVycHJldGVycygpO1xuICAgICAgICAgICAgaWYgKGludGVycHJldGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW25ldyBJbnZhbGlkUHl0aG9uSW50ZXJwcmV0ZXJEaWFnbm9zdGljKGNvbnN0YW50c18xLkRpYWdub3N0aWNDb2Rlcy5Ob1B5dGhvbkludGVycHJldGVyc0RpYWdub3N0aWMpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHBsYXRmb3JtID0gdGhpcy5zZXJ2aWNlQ29udGFpbmVyLmdldCh0eXBlc18yLklQbGF0Zm9ybVNlcnZpY2UpO1xuICAgICAgICAgICAgaWYgKCFwbGF0Zm9ybS5pc01hYykge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGhlbHBlciA9IHRoaXMuc2VydmljZUNvbnRhaW5lci5nZXQoY29udHJhY3RzXzEuSUludGVycHJldGVySGVscGVyKTtcbiAgICAgICAgICAgIGlmICghaGVscGVyLmlzTWFjRGVmYXVsdFB5dGhvblBhdGgoc2V0dGluZ3MucHl0aG9uUGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBpbnRlcnByZXRlciA9IHlpZWxkIGludGVycHJldGVyU2VydmljZS5nZXRBY3RpdmVJbnRlcnByZXRlcigpO1xuICAgICAgICAgICAgaWYgKCFpbnRlcnByZXRlciB8fCBpbnRlcnByZXRlci50eXBlICE9PSBjb250cmFjdHNfMS5JbnRlcnByZXRlclR5cGUuVW5rbm93bikge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpbnRlcnByZXRlcnMuZmlsdGVyKGkgPT4gIWhlbHBlci5pc01hY0RlZmF1bHRQeXRob25QYXRoKGkucGF0aCkpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbbmV3IEludmFsaWRQeXRob25JbnRlcnByZXRlckRpYWdub3N0aWMoY29uc3RhbnRzXzEuRGlhZ25vc3RpY0NvZGVzLk1hY0ludGVycHJldGVyU2VsZWN0ZWRBbmROb090aGVySW50ZXJwcmV0ZXJzRGlhZ25vc3RpYyldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFtuZXcgSW52YWxpZFB5dGhvbkludGVycHJldGVyRGlhZ25vc3RpYyhjb25zdGFudHNfMS5EaWFnbm9zdGljQ29kZXMuTWFjSW50ZXJwcmV0ZXJTZWxlY3RlZEFuZEhhdmVPdGhlckludGVycHJldGVyc0RpYWdub3N0aWMpXTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGhhbmRsZShkaWFnbm9zdGljcykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKGRpYWdub3N0aWNzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2VTZXJ2aWNlID0gdGhpcy5zZXJ2aWNlQ29udGFpbmVyLmdldCh0eXBlc182LklEaWFnbm9zdGljSGFuZGxlclNlcnZpY2UsIHByb21wdEhhbmRsZXJfMS5EaWFnbm9zdGljQ29tbWFuZFByb21wdEhhbmRsZXJTZXJ2aWNlSWQpO1xuICAgICAgICAgICAgeWllbGQgUHJvbWlzZS5hbGwoZGlhZ25vc3RpY3MubWFwKChkaWFnbm9zdGljKSA9PiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNhbkhhbmRsZShkaWFnbm9zdGljKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbW1hbmRQcm9tcHRzID0gdGhpcy5nZXRDb21tYW5kUHJvbXB0cyhkaWFnbm9zdGljKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWVzc2FnZVNlcnZpY2UuaGFuZGxlKGRpYWdub3N0aWMsIHsgY29tbWFuZFByb21wdHMsIG1lc3NhZ2U6IGRpYWdub3N0aWMubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhZGRQeXRob25QYXRoQ2hhbmdlZEhhbmRsZXIoKSB7XG4gICAgICAgIGNvbnN0IHdvcmtzcGFjZVNlcnZpY2UgPSB0aGlzLnNlcnZpY2VDb250YWluZXIuZ2V0KHR5cGVzXzEuSVdvcmtzcGFjZVNlcnZpY2UpO1xuICAgICAgICBjb25zdCBkaXNwb3NhYmxlcyA9IHRoaXMuc2VydmljZUNvbnRhaW5lci5nZXQodHlwZXNfMy5JRGlzcG9zYWJsZVJlZ2lzdHJ5KTtcbiAgICAgICAgZGlzcG9zYWJsZXMucHVzaCh3b3Jrc3BhY2VTZXJ2aWNlLm9uRGlkQ2hhbmdlQ29uZmlndXJhdGlvbih0aGlzLm9uRGlkQ2hhbmdlQ29uZmlndXJhdGlvbi5iaW5kKHRoaXMpKSk7XG4gICAgfVxuICAgIG9uRGlkQ2hhbmdlQ29uZmlndXJhdGlvbihldmVudCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgY29uc3Qgd29ya3NwYWNlU2VydmljZSA9IHRoaXMuc2VydmljZUNvbnRhaW5lci5nZXQodHlwZXNfMS5JV29ya3NwYWNlU2VydmljZSk7XG4gICAgICAgICAgICBjb25zdCB3b3Jrc3BhY2VzVXJpcyA9IHdvcmtzcGFjZVNlcnZpY2UuaGFzV29ya3NwYWNlRm9sZGVycyA/IHdvcmtzcGFjZVNlcnZpY2Uud29ya3NwYWNlRm9sZGVycy5tYXAod29ya3NwYWNlID0+IHdvcmtzcGFjZS51cmkpIDogW3VuZGVmaW5lZF07XG4gICAgICAgICAgICBpZiAod29ya3NwYWNlc1VyaXMuZmluZEluZGV4KHVyaSA9PiBldmVudC5hZmZlY3RzQ29uZmlndXJhdGlvbigncHl0aG9uLnB5dGhvblBhdGgnLCB1cmkpKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBMZXRzIHdhaXQsIGZvciBtb3JlIGNoYW5nZXMsIGRpcnR5IHNpbXBsZSB0aHJvdHRsaW5nLlxuICAgICAgICAgICAgaWYgKHRoaXMudGltZU91dCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVPdXQpO1xuICAgICAgICAgICAgICAgIHRoaXMudGltZU91dCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudGltZU91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudGltZU91dCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0aGlzLmRpYWdub3NlKCkudGhlbihkaWFub3N0aWNzID0+IHRoaXMuaGFuZGxlKGRpYW5vc3RpY3MpKS5pZ25vcmVFcnJvcnMoKTtcbiAgICAgICAgICAgIH0sIHRoaXMuY2hhbmdlVGhyb3R0bGVUaW1lb3V0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldENvbW1hbmRQcm9tcHRzKGRpYWdub3N0aWMpIHtcbiAgICAgICAgY29uc3QgY29tbWFuZEZhY3RvcnkgPSB0aGlzLnNlcnZpY2VDb250YWluZXIuZ2V0KHR5cGVzXzUuSURpYWdub3N0aWNzQ29tbWFuZEZhY3RvcnkpO1xuICAgICAgICBzd2l0Y2ggKGRpYWdub3N0aWMuY29kZSkge1xuICAgICAgICAgICAgY2FzZSBjb25zdGFudHNfMS5EaWFnbm9zdGljQ29kZXMuTm9QeXRob25JbnRlcnByZXRlcnNEaWFnbm9zdGljOiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6ICdEb3dubG9hZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kOiBjb21tYW5kRmFjdG9yeS5jcmVhdGVDb21tYW5kKGRpYWdub3N0aWMsIHsgdHlwZTogJ2xhdW5jaCcsIG9wdGlvbnM6ICdodHRwczovL3d3dy5weXRob24ub3JnL2Rvd25sb2FkcycgfSlcbiAgICAgICAgICAgICAgICAgICAgfV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIGNvbnN0YW50c18xLkRpYWdub3N0aWNDb2Rlcy5NYWNJbnRlcnByZXRlclNlbGVjdGVkQW5kSGF2ZU90aGVySW50ZXJwcmV0ZXJzRGlhZ25vc3RpYzoge1xuICAgICAgICAgICAgICAgIHJldHVybiBbe1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiAnU2VsZWN0IFB5dGhvbiBJbnRlcnByZXRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kOiBjb21tYW5kRmFjdG9yeS5jcmVhdGVDb21tYW5kKGRpYWdub3N0aWMsIHsgdHlwZTogJ2V4ZWN1dGVWU0NDb21tYW5kJywgb3B0aW9uczogJ3B5dGhvbi5zZXRJbnRlcnByZXRlcicgfSlcbiAgICAgICAgICAgICAgICAgICAgfV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIGNvbnN0YW50c18xLkRpYWdub3N0aWNDb2Rlcy5NYWNJbnRlcnByZXRlclNlbGVjdGVkQW5kTm9PdGhlckludGVycHJldGVyc0RpYWdub3N0aWM6IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21wdDogJ0xlYXJuIG1vcmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWFuZDogY29tbWFuZEZhY3RvcnkuY3JlYXRlQ29tbWFuZChkaWFnbm9zdGljLCB7IHR5cGU6ICdsYXVuY2gnLCBvcHRpb25zOiAnaHR0cHM6Ly9jb2RlLnZpc3VhbHN0dWRpby5jb20vZG9jcy9weXRob24vcHl0aG9uLXR1dG9yaWFsI19wcmVyZXF1aXNpdGVzJyB9KVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6ICdEb3dubG9hZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kOiBjb21tYW5kRmFjdG9yeS5jcmVhdGVDb21tYW5kKGRpYWdub3N0aWMsIHsgdHlwZTogJ2xhdW5jaCcsIG9wdGlvbnM6ICdodHRwczovL3d3dy5weXRob24ub3JnL2Rvd25sb2FkcycgfSlcbiAgICAgICAgICAgICAgICAgICAgfV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGRpYWdub3N0aWMgZm9yIFxcJ0ludmFsaWRQeXRob25JbnRlcnByZXRlclNlcnZpY2VcXCcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5JbnZhbGlkUHl0aG9uSW50ZXJwcmV0ZXJTZXJ2aWNlID0gX19kZWNvcmF0ZShbXG4gICAgaW52ZXJzaWZ5XzEuaW5qZWN0YWJsZSgpLFxuICAgIF9fcGFyYW0oMCwgaW52ZXJzaWZ5XzEuaW5qZWN0KHR5cGVzXzQuSVNlcnZpY2VDb250YWluZXIpKVxuXSwgSW52YWxpZFB5dGhvbkludGVycHJldGVyU2VydmljZSk7XG5leHBvcnRzLkludmFsaWRQeXRob25JbnRlcnByZXRlclNlcnZpY2UgPSBJbnZhbGlkUHl0aG9uSW50ZXJwcmV0ZXJTZXJ2aWNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cHl0aG9uSW50ZXJwcmV0ZXIuanMubWFwIl19