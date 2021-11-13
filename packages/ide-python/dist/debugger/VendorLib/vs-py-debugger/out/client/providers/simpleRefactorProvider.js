"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const vscode = require("vscode");

const configSettings_1 = require("../common/configSettings");

const editor_1 = require("../common/editor");

const types_1 = require("../common/types");

const stopWatch_1 = require("../common/utils/stopWatch");

const proxy_1 = require("../refactor/proxy");

const telemetry_1 = require("../telemetry");

const constants_1 = require("../telemetry/constants");

let installer;

function activateSimplePythonRefactorProvider(context, outputChannel, serviceContainer) {
  installer = serviceContainer.get(types_1.IInstaller);
  let disposable = vscode.commands.registerCommand('python.refactorExtractVariable', () => {
    const stopWatch = new stopWatch_1.StopWatch();
    const promise = extractVariable(context.extensionPath, vscode.window.activeTextEditor, vscode.window.activeTextEditor.selection, // tslint:disable-next-line:no-empty
    outputChannel, serviceContainer).catch(() => {});
    telemetry_1.sendTelemetryWhenDone(constants_1.REFACTOR_EXTRACT_VAR, promise, stopWatch);
  });
  context.subscriptions.push(disposable);
  disposable = vscode.commands.registerCommand('python.refactorExtractMethod', () => {
    const stopWatch = new stopWatch_1.StopWatch();
    const promise = extractMethod(context.extensionPath, vscode.window.activeTextEditor, vscode.window.activeTextEditor.selection, // tslint:disable-next-line:no-empty
    outputChannel, serviceContainer).catch(() => {});
    telemetry_1.sendTelemetryWhenDone(constants_1.REFACTOR_EXTRACT_FUNCTION, promise, stopWatch);
  });
  context.subscriptions.push(disposable);
}

exports.activateSimplePythonRefactorProvider = activateSimplePythonRefactorProvider; // Exported for unit testing

function extractVariable(extensionDir, textEditor, range, // tslint:disable-next-line:no-any
outputChannel, serviceContainer) {
  let workspaceFolder = vscode.workspace.getWorkspaceFolder(textEditor.document.uri);

  if (!workspaceFolder && Array.isArray(vscode.workspace.workspaceFolders) && vscode.workspace.workspaceFolders.length > 0) {
    workspaceFolder = vscode.workspace.workspaceFolders[0];
  }

  const workspaceRoot = workspaceFolder ? workspaceFolder.uri.fsPath : __dirname;
  const pythonSettings = configSettings_1.PythonSettings.getInstance(workspaceFolder ? workspaceFolder.uri : undefined);
  return validateDocumentForRefactor(textEditor).then(() => {
    const newName = `newvariable${new Date().getMilliseconds().toString()}`;
    const proxy = new proxy_1.RefactorProxy(extensionDir, pythonSettings, workspaceRoot, serviceContainer);
    const rename = proxy.extractVariable(textEditor.document, newName, textEditor.document.uri.fsPath, range, textEditor.options).then(response => {
      return response.results[0].diff;
    });
    return extractName(extensionDir, textEditor, range, newName, rename, outputChannel);
  });
}

exports.extractVariable = extractVariable; // Exported for unit testing

function extractMethod(extensionDir, textEditor, range, // tslint:disable-next-line:no-any
outputChannel, serviceContainer) {
  let workspaceFolder = vscode.workspace.getWorkspaceFolder(textEditor.document.uri);

  if (!workspaceFolder && Array.isArray(vscode.workspace.workspaceFolders) && vscode.workspace.workspaceFolders.length > 0) {
    workspaceFolder = vscode.workspace.workspaceFolders[0];
  }

  const workspaceRoot = workspaceFolder ? workspaceFolder.uri.fsPath : __dirname;
  const pythonSettings = configSettings_1.PythonSettings.getInstance(workspaceFolder ? workspaceFolder.uri : undefined);
  return validateDocumentForRefactor(textEditor).then(() => {
    const newName = `newmethod${new Date().getMilliseconds().toString()}`;
    const proxy = new proxy_1.RefactorProxy(extensionDir, pythonSettings, workspaceRoot, serviceContainer);
    const rename = proxy.extractMethod(textEditor.document, newName, textEditor.document.uri.fsPath, range, textEditor.options).then(response => {
      return response.results[0].diff;
    });
    return extractName(extensionDir, textEditor, range, newName, rename, outputChannel);
  });
}

exports.extractMethod = extractMethod; // tslint:disable-next-line:no-any

function validateDocumentForRefactor(textEditor) {
  if (!textEditor.document.isDirty) {
    return Promise.resolve();
  } // tslint:disable-next-line:no-any


  return new Promise((resolve, reject) => {
    vscode.window.showInformationMessage('Please save changes before refactoring', 'Save').then(item => {
      if (item === 'Save') {
        textEditor.document.save().then(resolve, reject);
      } else {
        return reject();
      }
    });
  });
}

function extractName(extensionDir, textEditor, range, newName, // tslint:disable-next-line:no-any
renameResponse, outputChannel) {
  let changeStartsAtLine = -1;
  return renameResponse.then(diff => {
    if (diff.length === 0) {
      return [];
    }

    return editor_1.getTextEditsFromPatch(textEditor.document.getText(), diff);
  }).then(edits => {
    return textEditor.edit(editBuilder => {
      edits.forEach(edit => {
        if (changeStartsAtLine === -1 || changeStartsAtLine > edit.range.start.line) {
          changeStartsAtLine = edit.range.start.line;
        }

        editBuilder.replace(edit.range, edit.newText);
      });
    });
  }).then(done => {
    if (done && changeStartsAtLine >= 0) {
      let newWordPosition;

      for (let lineNumber = changeStartsAtLine; lineNumber < textEditor.document.lineCount; lineNumber += 1) {
        const line = textEditor.document.lineAt(lineNumber);
        const indexOfWord = line.text.indexOf(newName);

        if (indexOfWord >= 0) {
          newWordPosition = new vscode.Position(line.range.start.line, indexOfWord);
          break;
        }
      }

      if (newWordPosition) {
        textEditor.selections = [new vscode.Selection(newWordPosition, new vscode.Position(newWordPosition.line, newWordPosition.character + newName.length))];
        textEditor.revealRange(new vscode.Range(textEditor.selection.start, textEditor.selection.end), vscode.TextEditorRevealType.Default);
      }

      return newWordPosition;
    }

    return null;
  }).then(newWordPosition => {
    if (newWordPosition) {
      return textEditor.document.save().then(() => {
        // Now that we have selected the new variable, lets invoke the rename command
        return vscode.commands.executeCommand('editor.action.rename');
      });
    }
  }).catch(error => {
    if (error === 'Not installed') {
      installer.promptToInstall(types_1.Product.rope, textEditor.document.uri).catch(ex => console.error('Python Extension: simpleRefactorProvider.promptToInstall', ex));
      return Promise.reject('');
    }

    let errorMessage = `${error}`;

    if (typeof error === 'string') {
      errorMessage = error;
    }

    if (typeof error === 'object' && error.message) {
      errorMessage = error.message;
    }

    outputChannel.appendLine(`${'#'.repeat(10)}Refactor Output${'#'.repeat(10)}`);
    outputChannel.appendLine(`Error in refactoring:\n${errorMessage}`);
    vscode.window.showErrorMessage(`Cannot perform refactoring using selected element(s). (${errorMessage})`);
    return Promise.reject(error);
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNpbXBsZVJlZmFjdG9yUHJvdmlkZXIuanMiXSwibmFtZXMiOlsiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJleHBvcnRzIiwidmFsdWUiLCJ2c2NvZGUiLCJyZXF1aXJlIiwiY29uZmlnU2V0dGluZ3NfMSIsImVkaXRvcl8xIiwidHlwZXNfMSIsInN0b3BXYXRjaF8xIiwicHJveHlfMSIsInRlbGVtZXRyeV8xIiwiY29uc3RhbnRzXzEiLCJpbnN0YWxsZXIiLCJhY3RpdmF0ZVNpbXBsZVB5dGhvblJlZmFjdG9yUHJvdmlkZXIiLCJjb250ZXh0Iiwib3V0cHV0Q2hhbm5lbCIsInNlcnZpY2VDb250YWluZXIiLCJnZXQiLCJJSW5zdGFsbGVyIiwiZGlzcG9zYWJsZSIsImNvbW1hbmRzIiwicmVnaXN0ZXJDb21tYW5kIiwic3RvcFdhdGNoIiwiU3RvcFdhdGNoIiwicHJvbWlzZSIsImV4dHJhY3RWYXJpYWJsZSIsImV4dGVuc2lvblBhdGgiLCJ3aW5kb3ciLCJhY3RpdmVUZXh0RWRpdG9yIiwic2VsZWN0aW9uIiwiY2F0Y2giLCJzZW5kVGVsZW1ldHJ5V2hlbkRvbmUiLCJSRUZBQ1RPUl9FWFRSQUNUX1ZBUiIsInN1YnNjcmlwdGlvbnMiLCJwdXNoIiwiZXh0cmFjdE1ldGhvZCIsIlJFRkFDVE9SX0VYVFJBQ1RfRlVOQ1RJT04iLCJleHRlbnNpb25EaXIiLCJ0ZXh0RWRpdG9yIiwicmFuZ2UiLCJ3b3Jrc3BhY2VGb2xkZXIiLCJ3b3Jrc3BhY2UiLCJnZXRXb3Jrc3BhY2VGb2xkZXIiLCJkb2N1bWVudCIsInVyaSIsIkFycmF5IiwiaXNBcnJheSIsIndvcmtzcGFjZUZvbGRlcnMiLCJsZW5ndGgiLCJ3b3Jrc3BhY2VSb290IiwiZnNQYXRoIiwiX19kaXJuYW1lIiwicHl0aG9uU2V0dGluZ3MiLCJQeXRob25TZXR0aW5ncyIsImdldEluc3RhbmNlIiwidW5kZWZpbmVkIiwidmFsaWRhdGVEb2N1bWVudEZvclJlZmFjdG9yIiwidGhlbiIsIm5ld05hbWUiLCJEYXRlIiwiZ2V0TWlsbGlzZWNvbmRzIiwidG9TdHJpbmciLCJwcm94eSIsIlJlZmFjdG9yUHJveHkiLCJyZW5hbWUiLCJvcHRpb25zIiwicmVzcG9uc2UiLCJyZXN1bHRzIiwiZGlmZiIsImV4dHJhY3ROYW1lIiwiaXNEaXJ0eSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0Iiwic2hvd0luZm9ybWF0aW9uTWVzc2FnZSIsIml0ZW0iLCJzYXZlIiwicmVuYW1lUmVzcG9uc2UiLCJjaGFuZ2VTdGFydHNBdExpbmUiLCJnZXRUZXh0RWRpdHNGcm9tUGF0Y2giLCJnZXRUZXh0IiwiZWRpdHMiLCJlZGl0IiwiZWRpdEJ1aWxkZXIiLCJmb3JFYWNoIiwic3RhcnQiLCJsaW5lIiwicmVwbGFjZSIsIm5ld1RleHQiLCJkb25lIiwibmV3V29yZFBvc2l0aW9uIiwibGluZU51bWJlciIsImxpbmVDb3VudCIsImxpbmVBdCIsImluZGV4T2ZXb3JkIiwidGV4dCIsImluZGV4T2YiLCJQb3NpdGlvbiIsInNlbGVjdGlvbnMiLCJTZWxlY3Rpb24iLCJjaGFyYWN0ZXIiLCJyZXZlYWxSYW5nZSIsIlJhbmdlIiwiZW5kIiwiVGV4dEVkaXRvclJldmVhbFR5cGUiLCJEZWZhdWx0IiwiZXhlY3V0ZUNvbW1hbmQiLCJlcnJvciIsInByb21wdFRvSW5zdGFsbCIsIlByb2R1Y3QiLCJyb3BlIiwiZXgiLCJjb25zb2xlIiwiZXJyb3JNZXNzYWdlIiwibWVzc2FnZSIsImFwcGVuZExpbmUiLCJyZXBlYXQiLCJzaG93RXJyb3JNZXNzYWdlIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQUEsTUFBTSxDQUFDQyxjQUFQLENBQXNCQyxPQUF0QixFQUErQixZQUEvQixFQUE2QztBQUFFQyxFQUFBQSxLQUFLLEVBQUU7QUFBVCxDQUE3Qzs7QUFDQSxNQUFNQyxNQUFNLEdBQUdDLE9BQU8sQ0FBQyxRQUFELENBQXRCOztBQUNBLE1BQU1DLGdCQUFnQixHQUFHRCxPQUFPLENBQUMsMEJBQUQsQ0FBaEM7O0FBQ0EsTUFBTUUsUUFBUSxHQUFHRixPQUFPLENBQUMsa0JBQUQsQ0FBeEI7O0FBQ0EsTUFBTUcsT0FBTyxHQUFHSCxPQUFPLENBQUMsaUJBQUQsQ0FBdkI7O0FBQ0EsTUFBTUksV0FBVyxHQUFHSixPQUFPLENBQUMsMkJBQUQsQ0FBM0I7O0FBQ0EsTUFBTUssT0FBTyxHQUFHTCxPQUFPLENBQUMsbUJBQUQsQ0FBdkI7O0FBQ0EsTUFBTU0sV0FBVyxHQUFHTixPQUFPLENBQUMsY0FBRCxDQUEzQjs7QUFDQSxNQUFNTyxXQUFXLEdBQUdQLE9BQU8sQ0FBQyx3QkFBRCxDQUEzQjs7QUFDQSxJQUFJUSxTQUFKOztBQUNBLFNBQVNDLG9DQUFULENBQThDQyxPQUE5QyxFQUF1REMsYUFBdkQsRUFBc0VDLGdCQUF0RSxFQUF3RjtBQUNwRkosRUFBQUEsU0FBUyxHQUFHSSxnQkFBZ0IsQ0FBQ0MsR0FBakIsQ0FBcUJWLE9BQU8sQ0FBQ1csVUFBN0IsQ0FBWjtBQUNBLE1BQUlDLFVBQVUsR0FBR2hCLE1BQU0sQ0FBQ2lCLFFBQVAsQ0FBZ0JDLGVBQWhCLENBQWdDLGdDQUFoQyxFQUFrRSxNQUFNO0FBQ3JGLFVBQU1DLFNBQVMsR0FBRyxJQUFJZCxXQUFXLENBQUNlLFNBQWhCLEVBQWxCO0FBQ0EsVUFBTUMsT0FBTyxHQUFHQyxlQUFlLENBQUNYLE9BQU8sQ0FBQ1ksYUFBVCxFQUF3QnZCLE1BQU0sQ0FBQ3dCLE1BQVAsQ0FBY0MsZ0JBQXRDLEVBQXdEekIsTUFBTSxDQUFDd0IsTUFBUCxDQUFjQyxnQkFBZCxDQUErQkMsU0FBdkYsRUFDL0I7QUFDQWQsSUFBQUEsYUFGK0IsRUFFaEJDLGdCQUZnQixDQUFmLENBRWlCYyxLQUZqQixDQUV1QixNQUFNLENBQUcsQ0FGaEMsQ0FBaEI7QUFHQXBCLElBQUFBLFdBQVcsQ0FBQ3FCLHFCQUFaLENBQWtDcEIsV0FBVyxDQUFDcUIsb0JBQTlDLEVBQW9FUixPQUFwRSxFQUE2RUYsU0FBN0U7QUFDSCxHQU5nQixDQUFqQjtBQU9BUixFQUFBQSxPQUFPLENBQUNtQixhQUFSLENBQXNCQyxJQUF0QixDQUEyQmYsVUFBM0I7QUFDQUEsRUFBQUEsVUFBVSxHQUFHaEIsTUFBTSxDQUFDaUIsUUFBUCxDQUFnQkMsZUFBaEIsQ0FBZ0MsOEJBQWhDLEVBQWdFLE1BQU07QUFDL0UsVUFBTUMsU0FBUyxHQUFHLElBQUlkLFdBQVcsQ0FBQ2UsU0FBaEIsRUFBbEI7QUFDQSxVQUFNQyxPQUFPLEdBQUdXLGFBQWEsQ0FBQ3JCLE9BQU8sQ0FBQ1ksYUFBVCxFQUF3QnZCLE1BQU0sQ0FBQ3dCLE1BQVAsQ0FBY0MsZ0JBQXRDLEVBQXdEekIsTUFBTSxDQUFDd0IsTUFBUCxDQUFjQyxnQkFBZCxDQUErQkMsU0FBdkYsRUFDN0I7QUFDQWQsSUFBQUEsYUFGNkIsRUFFZEMsZ0JBRmMsQ0FBYixDQUVpQmMsS0FGakIsQ0FFdUIsTUFBTSxDQUFHLENBRmhDLENBQWhCO0FBR0FwQixJQUFBQSxXQUFXLENBQUNxQixxQkFBWixDQUFrQ3BCLFdBQVcsQ0FBQ3lCLHlCQUE5QyxFQUF5RVosT0FBekUsRUFBa0ZGLFNBQWxGO0FBQ0gsR0FOWSxDQUFiO0FBT0FSLEVBQUFBLE9BQU8sQ0FBQ21CLGFBQVIsQ0FBc0JDLElBQXRCLENBQTJCZixVQUEzQjtBQUNIOztBQUNEbEIsT0FBTyxDQUFDWSxvQ0FBUixHQUErQ0Esb0NBQS9DLEMsQ0FDQTs7QUFDQSxTQUFTWSxlQUFULENBQXlCWSxZQUF6QixFQUF1Q0MsVUFBdkMsRUFBbURDLEtBQW5ELEVBQ0E7QUFDQXhCLGFBRkEsRUFFZUMsZ0JBRmYsRUFFaUM7QUFDN0IsTUFBSXdCLGVBQWUsR0FBR3JDLE1BQU0sQ0FBQ3NDLFNBQVAsQ0FBaUJDLGtCQUFqQixDQUFvQ0osVUFBVSxDQUFDSyxRQUFYLENBQW9CQyxHQUF4RCxDQUF0Qjs7QUFDQSxNQUFJLENBQUNKLGVBQUQsSUFBb0JLLEtBQUssQ0FBQ0MsT0FBTixDQUFjM0MsTUFBTSxDQUFDc0MsU0FBUCxDQUFpQk0sZ0JBQS9CLENBQXBCLElBQXdFNUMsTUFBTSxDQUFDc0MsU0FBUCxDQUFpQk0sZ0JBQWpCLENBQWtDQyxNQUFsQyxHQUEyQyxDQUF2SCxFQUEwSDtBQUN0SFIsSUFBQUEsZUFBZSxHQUFHckMsTUFBTSxDQUFDc0MsU0FBUCxDQUFpQk0sZ0JBQWpCLENBQWtDLENBQWxDLENBQWxCO0FBQ0g7O0FBQ0QsUUFBTUUsYUFBYSxHQUFHVCxlQUFlLEdBQUdBLGVBQWUsQ0FBQ0ksR0FBaEIsQ0FBb0JNLE1BQXZCLEdBQWdDQyxTQUFyRTtBQUNBLFFBQU1DLGNBQWMsR0FBRy9DLGdCQUFnQixDQUFDZ0QsY0FBakIsQ0FBZ0NDLFdBQWhDLENBQTRDZCxlQUFlLEdBQUdBLGVBQWUsQ0FBQ0ksR0FBbkIsR0FBeUJXLFNBQXBGLENBQXZCO0FBQ0EsU0FBT0MsMkJBQTJCLENBQUNsQixVQUFELENBQTNCLENBQXdDbUIsSUFBeEMsQ0FBNkMsTUFBTTtBQUN0RCxVQUFNQyxPQUFPLEdBQUksY0FBYSxJQUFJQyxJQUFKLEdBQVdDLGVBQVgsR0FBNkJDLFFBQTdCLEVBQXdDLEVBQXRFO0FBQ0EsVUFBTUMsS0FBSyxHQUFHLElBQUlyRCxPQUFPLENBQUNzRCxhQUFaLENBQTBCMUIsWUFBMUIsRUFBd0NlLGNBQXhDLEVBQXdESCxhQUF4RCxFQUF1RWpDLGdCQUF2RSxDQUFkO0FBQ0EsVUFBTWdELE1BQU0sR0FBR0YsS0FBSyxDQUFDckMsZUFBTixDQUFzQmEsVUFBVSxDQUFDSyxRQUFqQyxFQUEyQ2UsT0FBM0MsRUFBb0RwQixVQUFVLENBQUNLLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCTSxNQUE1RSxFQUFvRlgsS0FBcEYsRUFBMkZELFVBQVUsQ0FBQzJCLE9BQXRHLEVBQStHUixJQUEvRyxDQUFvSFMsUUFBUSxJQUFJO0FBQzNJLGFBQU9BLFFBQVEsQ0FBQ0MsT0FBVCxDQUFpQixDQUFqQixFQUFvQkMsSUFBM0I7QUFDSCxLQUZjLENBQWY7QUFHQSxXQUFPQyxXQUFXLENBQUNoQyxZQUFELEVBQWVDLFVBQWYsRUFBMkJDLEtBQTNCLEVBQWtDbUIsT0FBbEMsRUFBMkNNLE1BQTNDLEVBQW1EakQsYUFBbkQsQ0FBbEI7QUFDSCxHQVBNLENBQVA7QUFRSDs7QUFDRGQsT0FBTyxDQUFDd0IsZUFBUixHQUEwQkEsZUFBMUIsQyxDQUNBOztBQUNBLFNBQVNVLGFBQVQsQ0FBdUJFLFlBQXZCLEVBQXFDQyxVQUFyQyxFQUFpREMsS0FBakQsRUFDQTtBQUNBeEIsYUFGQSxFQUVlQyxnQkFGZixFQUVpQztBQUM3QixNQUFJd0IsZUFBZSxHQUFHckMsTUFBTSxDQUFDc0MsU0FBUCxDQUFpQkMsa0JBQWpCLENBQW9DSixVQUFVLENBQUNLLFFBQVgsQ0FBb0JDLEdBQXhELENBQXRCOztBQUNBLE1BQUksQ0FBQ0osZUFBRCxJQUFvQkssS0FBSyxDQUFDQyxPQUFOLENBQWMzQyxNQUFNLENBQUNzQyxTQUFQLENBQWlCTSxnQkFBL0IsQ0FBcEIsSUFBd0U1QyxNQUFNLENBQUNzQyxTQUFQLENBQWlCTSxnQkFBakIsQ0FBa0NDLE1BQWxDLEdBQTJDLENBQXZILEVBQTBIO0FBQ3RIUixJQUFBQSxlQUFlLEdBQUdyQyxNQUFNLENBQUNzQyxTQUFQLENBQWlCTSxnQkFBakIsQ0FBa0MsQ0FBbEMsQ0FBbEI7QUFDSDs7QUFDRCxRQUFNRSxhQUFhLEdBQUdULGVBQWUsR0FBR0EsZUFBZSxDQUFDSSxHQUFoQixDQUFvQk0sTUFBdkIsR0FBZ0NDLFNBQXJFO0FBQ0EsUUFBTUMsY0FBYyxHQUFHL0MsZ0JBQWdCLENBQUNnRCxjQUFqQixDQUFnQ0MsV0FBaEMsQ0FBNENkLGVBQWUsR0FBR0EsZUFBZSxDQUFDSSxHQUFuQixHQUF5QlcsU0FBcEYsQ0FBdkI7QUFDQSxTQUFPQywyQkFBMkIsQ0FBQ2xCLFVBQUQsQ0FBM0IsQ0FBd0NtQixJQUF4QyxDQUE2QyxNQUFNO0FBQ3RELFVBQU1DLE9BQU8sR0FBSSxZQUFXLElBQUlDLElBQUosR0FBV0MsZUFBWCxHQUE2QkMsUUFBN0IsRUFBd0MsRUFBcEU7QUFDQSxVQUFNQyxLQUFLLEdBQUcsSUFBSXJELE9BQU8sQ0FBQ3NELGFBQVosQ0FBMEIxQixZQUExQixFQUF3Q2UsY0FBeEMsRUFBd0RILGFBQXhELEVBQXVFakMsZ0JBQXZFLENBQWQ7QUFDQSxVQUFNZ0QsTUFBTSxHQUFHRixLQUFLLENBQUMzQixhQUFOLENBQW9CRyxVQUFVLENBQUNLLFFBQS9CLEVBQXlDZSxPQUF6QyxFQUFrRHBCLFVBQVUsQ0FBQ0ssUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0JNLE1BQTFFLEVBQWtGWCxLQUFsRixFQUF5RkQsVUFBVSxDQUFDMkIsT0FBcEcsRUFBNkdSLElBQTdHLENBQWtIUyxRQUFRLElBQUk7QUFDekksYUFBT0EsUUFBUSxDQUFDQyxPQUFULENBQWlCLENBQWpCLEVBQW9CQyxJQUEzQjtBQUNILEtBRmMsQ0FBZjtBQUdBLFdBQU9DLFdBQVcsQ0FBQ2hDLFlBQUQsRUFBZUMsVUFBZixFQUEyQkMsS0FBM0IsRUFBa0NtQixPQUFsQyxFQUEyQ00sTUFBM0MsRUFBbURqRCxhQUFuRCxDQUFsQjtBQUNILEdBUE0sQ0FBUDtBQVFIOztBQUNEZCxPQUFPLENBQUNrQyxhQUFSLEdBQXdCQSxhQUF4QixDLENBQ0E7O0FBQ0EsU0FBU3FCLDJCQUFULENBQXFDbEIsVUFBckMsRUFBaUQ7QUFDN0MsTUFBSSxDQUFDQSxVQUFVLENBQUNLLFFBQVgsQ0FBb0IyQixPQUF6QixFQUFrQztBQUM5QixXQUFPQyxPQUFPLENBQUNDLE9BQVIsRUFBUDtBQUNILEdBSDRDLENBSTdDOzs7QUFDQSxTQUFPLElBQUlELE9BQUosQ0FBWSxDQUFDQyxPQUFELEVBQVVDLE1BQVYsS0FBcUI7QUFDcEN0RSxJQUFBQSxNQUFNLENBQUN3QixNQUFQLENBQWMrQyxzQkFBZCxDQUFxQyx3Q0FBckMsRUFBK0UsTUFBL0UsRUFBdUZqQixJQUF2RixDQUE0RmtCLElBQUksSUFBSTtBQUNoRyxVQUFJQSxJQUFJLEtBQUssTUFBYixFQUFxQjtBQUNqQnJDLFFBQUFBLFVBQVUsQ0FBQ0ssUUFBWCxDQUFvQmlDLElBQXBCLEdBQTJCbkIsSUFBM0IsQ0FBZ0NlLE9BQWhDLEVBQXlDQyxNQUF6QztBQUNILE9BRkQsTUFHSztBQUNELGVBQU9BLE1BQU0sRUFBYjtBQUNIO0FBQ0osS0FQRDtBQVFILEdBVE0sQ0FBUDtBQVVIOztBQUNELFNBQVNKLFdBQVQsQ0FBcUJoQyxZQUFyQixFQUFtQ0MsVUFBbkMsRUFBK0NDLEtBQS9DLEVBQXNEbUIsT0FBdEQsRUFDQTtBQUNBbUIsY0FGQSxFQUVnQjlELGFBRmhCLEVBRStCO0FBQzNCLE1BQUkrRCxrQkFBa0IsR0FBRyxDQUFDLENBQTFCO0FBQ0EsU0FBT0QsY0FBYyxDQUFDcEIsSUFBZixDQUFvQlcsSUFBSSxJQUFJO0FBQy9CLFFBQUlBLElBQUksQ0FBQ3BCLE1BQUwsS0FBZ0IsQ0FBcEIsRUFBdUI7QUFDbkIsYUFBTyxFQUFQO0FBQ0g7O0FBQ0QsV0FBTzFDLFFBQVEsQ0FBQ3lFLHFCQUFULENBQStCekMsVUFBVSxDQUFDSyxRQUFYLENBQW9CcUMsT0FBcEIsRUFBL0IsRUFBOERaLElBQTlELENBQVA7QUFDSCxHQUxNLEVBS0pYLElBTEksQ0FLQ3dCLEtBQUssSUFBSTtBQUNiLFdBQU8zQyxVQUFVLENBQUM0QyxJQUFYLENBQWdCQyxXQUFXLElBQUk7QUFDbENGLE1BQUFBLEtBQUssQ0FBQ0csT0FBTixDQUFjRixJQUFJLElBQUk7QUFDbEIsWUFBSUosa0JBQWtCLEtBQUssQ0FBQyxDQUF4QixJQUE2QkEsa0JBQWtCLEdBQUdJLElBQUksQ0FBQzNDLEtBQUwsQ0FBVzhDLEtBQVgsQ0FBaUJDLElBQXZFLEVBQTZFO0FBQ3pFUixVQUFBQSxrQkFBa0IsR0FBR0ksSUFBSSxDQUFDM0MsS0FBTCxDQUFXOEMsS0FBWCxDQUFpQkMsSUFBdEM7QUFDSDs7QUFDREgsUUFBQUEsV0FBVyxDQUFDSSxPQUFaLENBQW9CTCxJQUFJLENBQUMzQyxLQUF6QixFQUFnQzJDLElBQUksQ0FBQ00sT0FBckM7QUFDSCxPQUxEO0FBTUgsS0FQTSxDQUFQO0FBUUgsR0FkTSxFQWNKL0IsSUFkSSxDQWNDZ0MsSUFBSSxJQUFJO0FBQ1osUUFBSUEsSUFBSSxJQUFJWCxrQkFBa0IsSUFBSSxDQUFsQyxFQUFxQztBQUNqQyxVQUFJWSxlQUFKOztBQUNBLFdBQUssSUFBSUMsVUFBVSxHQUFHYixrQkFBdEIsRUFBMENhLFVBQVUsR0FBR3JELFVBQVUsQ0FBQ0ssUUFBWCxDQUFvQmlELFNBQTNFLEVBQXNGRCxVQUFVLElBQUksQ0FBcEcsRUFBdUc7QUFDbkcsY0FBTUwsSUFBSSxHQUFHaEQsVUFBVSxDQUFDSyxRQUFYLENBQW9Ca0QsTUFBcEIsQ0FBMkJGLFVBQTNCLENBQWI7QUFDQSxjQUFNRyxXQUFXLEdBQUdSLElBQUksQ0FBQ1MsSUFBTCxDQUFVQyxPQUFWLENBQWtCdEMsT0FBbEIsQ0FBcEI7O0FBQ0EsWUFBSW9DLFdBQVcsSUFBSSxDQUFuQixFQUFzQjtBQUNsQkosVUFBQUEsZUFBZSxHQUFHLElBQUl2RixNQUFNLENBQUM4RixRQUFYLENBQW9CWCxJQUFJLENBQUMvQyxLQUFMLENBQVc4QyxLQUFYLENBQWlCQyxJQUFyQyxFQUEyQ1EsV0FBM0MsQ0FBbEI7QUFDQTtBQUNIO0FBQ0o7O0FBQ0QsVUFBSUosZUFBSixFQUFxQjtBQUNqQnBELFFBQUFBLFVBQVUsQ0FBQzRELFVBQVgsR0FBd0IsQ0FBQyxJQUFJL0YsTUFBTSxDQUFDZ0csU0FBWCxDQUFxQlQsZUFBckIsRUFBc0MsSUFBSXZGLE1BQU0sQ0FBQzhGLFFBQVgsQ0FBb0JQLGVBQWUsQ0FBQ0osSUFBcEMsRUFBMENJLGVBQWUsQ0FBQ1UsU0FBaEIsR0FBNEIxQyxPQUFPLENBQUNWLE1BQTlFLENBQXRDLENBQUQsQ0FBeEI7QUFDQVYsUUFBQUEsVUFBVSxDQUFDK0QsV0FBWCxDQUF1QixJQUFJbEcsTUFBTSxDQUFDbUcsS0FBWCxDQUFpQmhFLFVBQVUsQ0FBQ1QsU0FBWCxDQUFxQndELEtBQXRDLEVBQTZDL0MsVUFBVSxDQUFDVCxTQUFYLENBQXFCMEUsR0FBbEUsQ0FBdkIsRUFBK0ZwRyxNQUFNLENBQUNxRyxvQkFBUCxDQUE0QkMsT0FBM0g7QUFDSDs7QUFDRCxhQUFPZixlQUFQO0FBQ0g7O0FBQ0QsV0FBTyxJQUFQO0FBQ0gsR0FoQ00sRUFnQ0pqQyxJQWhDSSxDQWdDQ2lDLGVBQWUsSUFBSTtBQUN2QixRQUFJQSxlQUFKLEVBQXFCO0FBQ2pCLGFBQU9wRCxVQUFVLENBQUNLLFFBQVgsQ0FBb0JpQyxJQUFwQixHQUEyQm5CLElBQTNCLENBQWdDLE1BQU07QUFDekM7QUFDQSxlQUFPdEQsTUFBTSxDQUFDaUIsUUFBUCxDQUFnQnNGLGNBQWhCLENBQStCLHNCQUEvQixDQUFQO0FBQ0gsT0FITSxDQUFQO0FBSUg7QUFDSixHQXZDTSxFQXVDSjVFLEtBdkNJLENBdUNFNkUsS0FBSyxJQUFJO0FBQ2QsUUFBSUEsS0FBSyxLQUFLLGVBQWQsRUFBK0I7QUFDM0IvRixNQUFBQSxTQUFTLENBQUNnRyxlQUFWLENBQTBCckcsT0FBTyxDQUFDc0csT0FBUixDQUFnQkMsSUFBMUMsRUFBZ0R4RSxVQUFVLENBQUNLLFFBQVgsQ0FBb0JDLEdBQXBFLEVBQ0tkLEtBREwsQ0FDV2lGLEVBQUUsSUFBSUMsT0FBTyxDQUFDTCxLQUFSLENBQWMsMERBQWQsRUFBMEVJLEVBQTFFLENBRGpCO0FBRUEsYUFBT3hDLE9BQU8sQ0FBQ0UsTUFBUixDQUFlLEVBQWYsQ0FBUDtBQUNIOztBQUNELFFBQUl3QyxZQUFZLEdBQUksR0FBRU4sS0FBTSxFQUE1Qjs7QUFDQSxRQUFJLE9BQU9BLEtBQVAsS0FBaUIsUUFBckIsRUFBK0I7QUFDM0JNLE1BQUFBLFlBQVksR0FBR04sS0FBZjtBQUNIOztBQUNELFFBQUksT0FBT0EsS0FBUCxLQUFpQixRQUFqQixJQUE2QkEsS0FBSyxDQUFDTyxPQUF2QyxFQUFnRDtBQUM1Q0QsTUFBQUEsWUFBWSxHQUFHTixLQUFLLENBQUNPLE9BQXJCO0FBQ0g7O0FBQ0RuRyxJQUFBQSxhQUFhLENBQUNvRyxVQUFkLENBQTBCLEdBQUUsSUFBSUMsTUFBSixDQUFXLEVBQVgsQ0FBZSxrQkFBaUIsSUFBSUEsTUFBSixDQUFXLEVBQVgsQ0FBZSxFQUEzRTtBQUNBckcsSUFBQUEsYUFBYSxDQUFDb0csVUFBZCxDQUEwQiwwQkFBeUJGLFlBQWEsRUFBaEU7QUFDQTlHLElBQUFBLE1BQU0sQ0FBQ3dCLE1BQVAsQ0FBYzBGLGdCQUFkLENBQWdDLDBEQUF5REosWUFBYSxHQUF0RztBQUNBLFdBQU8xQyxPQUFPLENBQUNFLE1BQVIsQ0FBZWtDLEtBQWYsQ0FBUDtBQUNILEdBeERNLENBQVA7QUF5REgiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IHZzY29kZSA9IHJlcXVpcmUoXCJ2c2NvZGVcIik7XG5jb25zdCBjb25maWdTZXR0aW5nc18xID0gcmVxdWlyZShcIi4uL2NvbW1vbi9jb25maWdTZXR0aW5nc1wiKTtcbmNvbnN0IGVkaXRvcl8xID0gcmVxdWlyZShcIi4uL2NvbW1vbi9lZGl0b3JcIik7XG5jb25zdCB0eXBlc18xID0gcmVxdWlyZShcIi4uL2NvbW1vbi90eXBlc1wiKTtcbmNvbnN0IHN0b3BXYXRjaF8xID0gcmVxdWlyZShcIi4uL2NvbW1vbi91dGlscy9zdG9wV2F0Y2hcIik7XG5jb25zdCBwcm94eV8xID0gcmVxdWlyZShcIi4uL3JlZmFjdG9yL3Byb3h5XCIpO1xuY29uc3QgdGVsZW1ldHJ5XzEgPSByZXF1aXJlKFwiLi4vdGVsZW1ldHJ5XCIpO1xuY29uc3QgY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiLi4vdGVsZW1ldHJ5L2NvbnN0YW50c1wiKTtcbmxldCBpbnN0YWxsZXI7XG5mdW5jdGlvbiBhY3RpdmF0ZVNpbXBsZVB5dGhvblJlZmFjdG9yUHJvdmlkZXIoY29udGV4dCwgb3V0cHV0Q2hhbm5lbCwgc2VydmljZUNvbnRhaW5lcikge1xuICAgIGluc3RhbGxlciA9IHNlcnZpY2VDb250YWluZXIuZ2V0KHR5cGVzXzEuSUluc3RhbGxlcik7XG4gICAgbGV0IGRpc3Bvc2FibGUgPSB2c2NvZGUuY29tbWFuZHMucmVnaXN0ZXJDb21tYW5kKCdweXRob24ucmVmYWN0b3JFeHRyYWN0VmFyaWFibGUnLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0b3BXYXRjaCA9IG5ldyBzdG9wV2F0Y2hfMS5TdG9wV2F0Y2goKTtcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IGV4dHJhY3RWYXJpYWJsZShjb250ZXh0LmV4dGVuc2lvblBhdGgsIHZzY29kZS53aW5kb3cuYWN0aXZlVGV4dEVkaXRvciwgdnNjb2RlLndpbmRvdy5hY3RpdmVUZXh0RWRpdG9yLnNlbGVjdGlvbiwgXG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1lbXB0eVxuICAgICAgICBvdXRwdXRDaGFubmVsLCBzZXJ2aWNlQ29udGFpbmVyKS5jYXRjaCgoKSA9PiB7IH0pO1xuICAgICAgICB0ZWxlbWV0cnlfMS5zZW5kVGVsZW1ldHJ5V2hlbkRvbmUoY29uc3RhbnRzXzEuUkVGQUNUT1JfRVhUUkFDVF9WQVIsIHByb21pc2UsIHN0b3BXYXRjaCk7XG4gICAgfSk7XG4gICAgY29udGV4dC5zdWJzY3JpcHRpb25zLnB1c2goZGlzcG9zYWJsZSk7XG4gICAgZGlzcG9zYWJsZSA9IHZzY29kZS5jb21tYW5kcy5yZWdpc3RlckNvbW1hbmQoJ3B5dGhvbi5yZWZhY3RvckV4dHJhY3RNZXRob2QnLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0b3BXYXRjaCA9IG5ldyBzdG9wV2F0Y2hfMS5TdG9wV2F0Y2goKTtcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IGV4dHJhY3RNZXRob2QoY29udGV4dC5leHRlbnNpb25QYXRoLCB2c2NvZGUud2luZG93LmFjdGl2ZVRleHRFZGl0b3IsIHZzY29kZS53aW5kb3cuYWN0aXZlVGV4dEVkaXRvci5zZWxlY3Rpb24sIFxuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tZW1wdHlcbiAgICAgICAgb3V0cHV0Q2hhbm5lbCwgc2VydmljZUNvbnRhaW5lcikuY2F0Y2goKCkgPT4geyB9KTtcbiAgICAgICAgdGVsZW1ldHJ5XzEuc2VuZFRlbGVtZXRyeVdoZW5Eb25lKGNvbnN0YW50c18xLlJFRkFDVE9SX0VYVFJBQ1RfRlVOQ1RJT04sIHByb21pc2UsIHN0b3BXYXRjaCk7XG4gICAgfSk7XG4gICAgY29udGV4dC5zdWJzY3JpcHRpb25zLnB1c2goZGlzcG9zYWJsZSk7XG59XG5leHBvcnRzLmFjdGl2YXRlU2ltcGxlUHl0aG9uUmVmYWN0b3JQcm92aWRlciA9IGFjdGl2YXRlU2ltcGxlUHl0aG9uUmVmYWN0b3JQcm92aWRlcjtcbi8vIEV4cG9ydGVkIGZvciB1bml0IHRlc3RpbmdcbmZ1bmN0aW9uIGV4dHJhY3RWYXJpYWJsZShleHRlbnNpb25EaXIsIHRleHRFZGl0b3IsIHJhbmdlLCBcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbm91dHB1dENoYW5uZWwsIHNlcnZpY2VDb250YWluZXIpIHtcbiAgICBsZXQgd29ya3NwYWNlRm9sZGVyID0gdnNjb2RlLndvcmtzcGFjZS5nZXRXb3Jrc3BhY2VGb2xkZXIodGV4dEVkaXRvci5kb2N1bWVudC51cmkpO1xuICAgIGlmICghd29ya3NwYWNlRm9sZGVyICYmIEFycmF5LmlzQXJyYXkodnNjb2RlLndvcmtzcGFjZS53b3Jrc3BhY2VGb2xkZXJzKSAmJiB2c2NvZGUud29ya3NwYWNlLndvcmtzcGFjZUZvbGRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICB3b3Jrc3BhY2VGb2xkZXIgPSB2c2NvZGUud29ya3NwYWNlLndvcmtzcGFjZUZvbGRlcnNbMF07XG4gICAgfVxuICAgIGNvbnN0IHdvcmtzcGFjZVJvb3QgPSB3b3Jrc3BhY2VGb2xkZXIgPyB3b3Jrc3BhY2VGb2xkZXIudXJpLmZzUGF0aCA6IF9fZGlybmFtZTtcbiAgICBjb25zdCBweXRob25TZXR0aW5ncyA9IGNvbmZpZ1NldHRpbmdzXzEuUHl0aG9uU2V0dGluZ3MuZ2V0SW5zdGFuY2Uod29ya3NwYWNlRm9sZGVyID8gd29ya3NwYWNlRm9sZGVyLnVyaSA6IHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHZhbGlkYXRlRG9jdW1lbnRGb3JSZWZhY3Rvcih0ZXh0RWRpdG9yKS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgbmV3TmFtZSA9IGBuZXd2YXJpYWJsZSR7bmV3IERhdGUoKS5nZXRNaWxsaXNlY29uZHMoKS50b1N0cmluZygpfWA7XG4gICAgICAgIGNvbnN0IHByb3h5ID0gbmV3IHByb3h5XzEuUmVmYWN0b3JQcm94eShleHRlbnNpb25EaXIsIHB5dGhvblNldHRpbmdzLCB3b3Jrc3BhY2VSb290LCBzZXJ2aWNlQ29udGFpbmVyKTtcbiAgICAgICAgY29uc3QgcmVuYW1lID0gcHJveHkuZXh0cmFjdFZhcmlhYmxlKHRleHRFZGl0b3IuZG9jdW1lbnQsIG5ld05hbWUsIHRleHRFZGl0b3IuZG9jdW1lbnQudXJpLmZzUGF0aCwgcmFuZ2UsIHRleHRFZGl0b3Iub3B0aW9ucykudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UucmVzdWx0c1swXS5kaWZmO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGV4dHJhY3ROYW1lKGV4dGVuc2lvbkRpciwgdGV4dEVkaXRvciwgcmFuZ2UsIG5ld05hbWUsIHJlbmFtZSwgb3V0cHV0Q2hhbm5lbCk7XG4gICAgfSk7XG59XG5leHBvcnRzLmV4dHJhY3RWYXJpYWJsZSA9IGV4dHJhY3RWYXJpYWJsZTtcbi8vIEV4cG9ydGVkIGZvciB1bml0IHRlc3RpbmdcbmZ1bmN0aW9uIGV4dHJhY3RNZXRob2QoZXh0ZW5zaW9uRGlyLCB0ZXh0RWRpdG9yLCByYW5nZSwgXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG5vdXRwdXRDaGFubmVsLCBzZXJ2aWNlQ29udGFpbmVyKSB7XG4gICAgbGV0IHdvcmtzcGFjZUZvbGRlciA9IHZzY29kZS53b3Jrc3BhY2UuZ2V0V29ya3NwYWNlRm9sZGVyKHRleHRFZGl0b3IuZG9jdW1lbnQudXJpKTtcbiAgICBpZiAoIXdvcmtzcGFjZUZvbGRlciAmJiBBcnJheS5pc0FycmF5KHZzY29kZS53b3Jrc3BhY2Uud29ya3NwYWNlRm9sZGVycykgJiYgdnNjb2RlLndvcmtzcGFjZS53b3Jrc3BhY2VGb2xkZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgd29ya3NwYWNlRm9sZGVyID0gdnNjb2RlLndvcmtzcGFjZS53b3Jrc3BhY2VGb2xkZXJzWzBdO1xuICAgIH1cbiAgICBjb25zdCB3b3Jrc3BhY2VSb290ID0gd29ya3NwYWNlRm9sZGVyID8gd29ya3NwYWNlRm9sZGVyLnVyaS5mc1BhdGggOiBfX2Rpcm5hbWU7XG4gICAgY29uc3QgcHl0aG9uU2V0dGluZ3MgPSBjb25maWdTZXR0aW5nc18xLlB5dGhvblNldHRpbmdzLmdldEluc3RhbmNlKHdvcmtzcGFjZUZvbGRlciA/IHdvcmtzcGFjZUZvbGRlci51cmkgOiB1bmRlZmluZWQpO1xuICAgIHJldHVybiB2YWxpZGF0ZURvY3VtZW50Rm9yUmVmYWN0b3IodGV4dEVkaXRvcikudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5ld05hbWUgPSBgbmV3bWV0aG9kJHtuZXcgRGF0ZSgpLmdldE1pbGxpc2Vjb25kcygpLnRvU3RyaW5nKCl9YDtcbiAgICAgICAgY29uc3QgcHJveHkgPSBuZXcgcHJveHlfMS5SZWZhY3RvclByb3h5KGV4dGVuc2lvbkRpciwgcHl0aG9uU2V0dGluZ3MsIHdvcmtzcGFjZVJvb3QsIHNlcnZpY2VDb250YWluZXIpO1xuICAgICAgICBjb25zdCByZW5hbWUgPSBwcm94eS5leHRyYWN0TWV0aG9kKHRleHRFZGl0b3IuZG9jdW1lbnQsIG5ld05hbWUsIHRleHRFZGl0b3IuZG9jdW1lbnQudXJpLmZzUGF0aCwgcmFuZ2UsIHRleHRFZGl0b3Iub3B0aW9ucykudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UucmVzdWx0c1swXS5kaWZmO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGV4dHJhY3ROYW1lKGV4dGVuc2lvbkRpciwgdGV4dEVkaXRvciwgcmFuZ2UsIG5ld05hbWUsIHJlbmFtZSwgb3V0cHV0Q2hhbm5lbCk7XG4gICAgfSk7XG59XG5leHBvcnRzLmV4dHJhY3RNZXRob2QgPSBleHRyYWN0TWV0aG9kO1xuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuZnVuY3Rpb24gdmFsaWRhdGVEb2N1bWVudEZvclJlZmFjdG9yKHRleHRFZGl0b3IpIHtcbiAgICBpZiAoIXRleHRFZGl0b3IuZG9jdW1lbnQuaXNEaXJ0eSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB2c2NvZGUud2luZG93LnNob3dJbmZvcm1hdGlvbk1lc3NhZ2UoJ1BsZWFzZSBzYXZlIGNoYW5nZXMgYmVmb3JlIHJlZmFjdG9yaW5nJywgJ1NhdmUnKS50aGVuKGl0ZW0gPT4ge1xuICAgICAgICAgICAgaWYgKGl0ZW0gPT09ICdTYXZlJykge1xuICAgICAgICAgICAgICAgIHRleHRFZGl0b3IuZG9jdW1lbnQuc2F2ZSgpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBleHRyYWN0TmFtZShleHRlbnNpb25EaXIsIHRleHRFZGl0b3IsIHJhbmdlLCBuZXdOYW1lLCBcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbnJlbmFtZVJlc3BvbnNlLCBvdXRwdXRDaGFubmVsKSB7XG4gICAgbGV0IGNoYW5nZVN0YXJ0c0F0TGluZSA9IC0xO1xuICAgIHJldHVybiByZW5hbWVSZXNwb25zZS50aGVuKGRpZmYgPT4ge1xuICAgICAgICBpZiAoZGlmZi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWRpdG9yXzEuZ2V0VGV4dEVkaXRzRnJvbVBhdGNoKHRleHRFZGl0b3IuZG9jdW1lbnQuZ2V0VGV4dCgpLCBkaWZmKTtcbiAgICB9KS50aGVuKGVkaXRzID0+IHtcbiAgICAgICAgcmV0dXJuIHRleHRFZGl0b3IuZWRpdChlZGl0QnVpbGRlciA9PiB7XG4gICAgICAgICAgICBlZGl0cy5mb3JFYWNoKGVkaXQgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VTdGFydHNBdExpbmUgPT09IC0xIHx8IGNoYW5nZVN0YXJ0c0F0TGluZSA+IGVkaXQucmFuZ2Uuc3RhcnQubGluZSkge1xuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VTdGFydHNBdExpbmUgPSBlZGl0LnJhbmdlLnN0YXJ0LmxpbmU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVkaXRCdWlsZGVyLnJlcGxhY2UoZWRpdC5yYW5nZSwgZWRpdC5uZXdUZXh0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KS50aGVuKGRvbmUgPT4ge1xuICAgICAgICBpZiAoZG9uZSAmJiBjaGFuZ2VTdGFydHNBdExpbmUgPj0gMCkge1xuICAgICAgICAgICAgbGV0IG5ld1dvcmRQb3NpdGlvbjtcbiAgICAgICAgICAgIGZvciAobGV0IGxpbmVOdW1iZXIgPSBjaGFuZ2VTdGFydHNBdExpbmU7IGxpbmVOdW1iZXIgPCB0ZXh0RWRpdG9yLmRvY3VtZW50LmxpbmVDb3VudDsgbGluZU51bWJlciArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZSA9IHRleHRFZGl0b3IuZG9jdW1lbnQubGluZUF0KGxpbmVOdW1iZXIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4T2ZXb3JkID0gbGluZS50ZXh0LmluZGV4T2YobmV3TmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4T2ZXb3JkID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3V29yZFBvc2l0aW9uID0gbmV3IHZzY29kZS5Qb3NpdGlvbihsaW5lLnJhbmdlLnN0YXJ0LmxpbmUsIGluZGV4T2ZXb3JkKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5ld1dvcmRQb3NpdGlvbikge1xuICAgICAgICAgICAgICAgIHRleHRFZGl0b3Iuc2VsZWN0aW9ucyA9IFtuZXcgdnNjb2RlLlNlbGVjdGlvbihuZXdXb3JkUG9zaXRpb24sIG5ldyB2c2NvZGUuUG9zaXRpb24obmV3V29yZFBvc2l0aW9uLmxpbmUsIG5ld1dvcmRQb3NpdGlvbi5jaGFyYWN0ZXIgKyBuZXdOYW1lLmxlbmd0aCkpXTtcbiAgICAgICAgICAgICAgICB0ZXh0RWRpdG9yLnJldmVhbFJhbmdlKG5ldyB2c2NvZGUuUmFuZ2UodGV4dEVkaXRvci5zZWxlY3Rpb24uc3RhcnQsIHRleHRFZGl0b3Iuc2VsZWN0aW9uLmVuZCksIHZzY29kZS5UZXh0RWRpdG9yUmV2ZWFsVHlwZS5EZWZhdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdXb3JkUG9zaXRpb247XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSkudGhlbihuZXdXb3JkUG9zaXRpb24gPT4ge1xuICAgICAgICBpZiAobmV3V29yZFBvc2l0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gdGV4dEVkaXRvci5kb2N1bWVudC5zYXZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSBzZWxlY3RlZCB0aGUgbmV3IHZhcmlhYmxlLCBsZXRzIGludm9rZSB0aGUgcmVuYW1lIGNvbW1hbmRcbiAgICAgICAgICAgICAgICByZXR1cm4gdnNjb2RlLmNvbW1hbmRzLmV4ZWN1dGVDb21tYW5kKCdlZGl0b3IuYWN0aW9uLnJlbmFtZScpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIGlmIChlcnJvciA9PT0gJ05vdCBpbnN0YWxsZWQnKSB7XG4gICAgICAgICAgICBpbnN0YWxsZXIucHJvbXB0VG9JbnN0YWxsKHR5cGVzXzEuUHJvZHVjdC5yb3BlLCB0ZXh0RWRpdG9yLmRvY3VtZW50LnVyaSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZXggPT4gY29uc29sZS5lcnJvcignUHl0aG9uIEV4dGVuc2lvbjogc2ltcGxlUmVmYWN0b3JQcm92aWRlci5wcm9tcHRUb0luc3RhbGwnLCBleCkpO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCcnKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZXJyb3JNZXNzYWdlID0gYCR7ZXJyb3J9YDtcbiAgICAgICAgaWYgKHR5cGVvZiBlcnJvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZXJyb3IgPT09ICdvYmplY3QnICYmIGVycm9yLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U7XG4gICAgICAgIH1cbiAgICAgICAgb3V0cHV0Q2hhbm5lbC5hcHBlbmRMaW5lKGAkeycjJy5yZXBlYXQoMTApfVJlZmFjdG9yIE91dHB1dCR7JyMnLnJlcGVhdCgxMCl9YCk7XG4gICAgICAgIG91dHB1dENoYW5uZWwuYXBwZW5kTGluZShgRXJyb3IgaW4gcmVmYWN0b3Jpbmc6XFxuJHtlcnJvck1lc3NhZ2V9YCk7XG4gICAgICAgIHZzY29kZS53aW5kb3cuc2hvd0Vycm9yTWVzc2FnZShgQ2Fubm90IHBlcmZvcm0gcmVmYWN0b3JpbmcgdXNpbmcgc2VsZWN0ZWQgZWxlbWVudChzKS4gKCR7ZXJyb3JNZXNzYWdlfSlgKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICB9KTtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNpbXBsZVJlZmFjdG9yUHJvdmlkZXIuanMubWFwIl19