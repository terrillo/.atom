"use strict"; // Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

Object.defineProperty(exports, "__esModule", {
  value: true
}); // tslint:disable:no-any

const inversify_1 = require("inversify");

const vscode_1 = require("vscode");

let CommandManager = class CommandManager {
  /**
   * Registers a command that can be invoked via a keyboard shortcut,
   * a menu item, an action, or directly.
   *
   * Registering a command with an existing command identifier twice
   * will cause an error.
   *
   * @param command A unique identifier for the command.
   * @param callback A command handler function.
   * @param thisArg The `this` context used when invoking the handler function.
   * @return Disposable which unregisters this command on disposal.
   */
  registerCommand(command, callback, thisArg) {
    return vscode_1.commands.registerCommand(command, callback, thisArg);
  }
  /**
   * Registers a text editor command that can be invoked via a keyboard shortcut,
   * a menu item, an action, or directly.
   *
   * Text editor commands are different from ordinary [commands](#commands.registerCommand) as
   * they only execute when there is an active editor when the command is called. Also, the
   * command handler of an editor command has access to the active editor and to an
   * [edit](#TextEditorEdit)-builder.
   *
   * @param command A unique identifier for the command.
   * @param callback A command handler function with access to an [editor](#TextEditor) and an [edit](#TextEditorEdit).
   * @param thisArg The `this` context used when invoking the handler function.
   * @return Disposable which unregisters this command on disposal.
   */


  registerTextEditorCommand(command, callback, thisArg) {
    return vscode_1.commands.registerTextEditorCommand(command, callback, thisArg);
  }
  /**
   * Executes the command denoted by the given command identifier.
   *
   * * *Note 1:* When executing an editor command not all types are allowed to
   * be passed as arguments. Allowed are the primitive types `string`, `boolean`,
   * `number`, `undefined`, and `null`, as well as [`Position`](#Position), [`Range`](#Range), [`Uri`](#Uri) and [`Location`](#Location).
   * * *Note 2:* There are no restrictions when executing commands that have been contributed
   * by extensions.
   *
   * @param command Identifier of the command to execute.
   * @param rest Parameters passed to the command function.
   * @return A thenable that resolves to the returned value of the given command. `undefined` when
   * the command handler function doesn't return anything.
   */


  executeCommand(command, ...rest) {
    return vscode_1.commands.executeCommand(command, ...rest);
  }
  /**
   * Retrieve the list of all available commands. Commands starting an underscore are
   * treated as internal commands.
   *
   * @param filterInternal Set `true` to not see internal commands (starting with an underscore)
   * @return Thenable that resolves to a list of command ids.
   */


  getCommands(filterInternal) {
    return vscode_1.commands.getCommands(filterInternal);
  }

};
CommandManager = __decorate([inversify_1.injectable()], CommandManager);
exports.CommandManager = CommandManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1hbmRNYW5hZ2VyLmpzIl0sIm5hbWVzIjpbIl9fZGVjb3JhdGUiLCJkZWNvcmF0b3JzIiwidGFyZ2V0Iiwia2V5IiwiZGVzYyIsImMiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJyIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiZCIsIlJlZmxlY3QiLCJkZWNvcmF0ZSIsImkiLCJkZWZpbmVQcm9wZXJ0eSIsImV4cG9ydHMiLCJ2YWx1ZSIsImludmVyc2lmeV8xIiwicmVxdWlyZSIsInZzY29kZV8xIiwiQ29tbWFuZE1hbmFnZXIiLCJyZWdpc3RlckNvbW1hbmQiLCJjb21tYW5kIiwiY2FsbGJhY2siLCJ0aGlzQXJnIiwiY29tbWFuZHMiLCJyZWdpc3RlclRleHRFZGl0b3JDb21tYW5kIiwiZXhlY3V0ZUNvbW1hbmQiLCJyZXN0IiwiZ2V0Q29tbWFuZHMiLCJmaWx0ZXJJbnRlcm5hbCIsImluamVjdGFibGUiXSwibWFwcGluZ3MiOiJBQUFBLGEsQ0FDQTtBQUNBOztBQUNBLElBQUlBLFVBQVUsR0FBSSxVQUFRLFNBQUtBLFVBQWQsSUFBNkIsVUFBVUMsVUFBVixFQUFzQkMsTUFBdEIsRUFBOEJDLEdBQTlCLEVBQW1DQyxJQUFuQyxFQUF5QztBQUNuRixNQUFJQyxDQUFDLEdBQUdDLFNBQVMsQ0FBQ0MsTUFBbEI7QUFBQSxNQUEwQkMsQ0FBQyxHQUFHSCxDQUFDLEdBQUcsQ0FBSixHQUFRSCxNQUFSLEdBQWlCRSxJQUFJLEtBQUssSUFBVCxHQUFnQkEsSUFBSSxHQUFHSyxNQUFNLENBQUNDLHdCQUFQLENBQWdDUixNQUFoQyxFQUF3Q0MsR0FBeEMsQ0FBdkIsR0FBc0VDLElBQXJIO0FBQUEsTUFBMkhPLENBQTNIO0FBQ0EsTUFBSSxPQUFPQyxPQUFQLEtBQW1CLFFBQW5CLElBQStCLE9BQU9BLE9BQU8sQ0FBQ0MsUUFBZixLQUE0QixVQUEvRCxFQUEyRUwsQ0FBQyxHQUFHSSxPQUFPLENBQUNDLFFBQVIsQ0FBaUJaLFVBQWpCLEVBQTZCQyxNQUE3QixFQUFxQ0MsR0FBckMsRUFBMENDLElBQTFDLENBQUosQ0FBM0UsS0FDSyxLQUFLLElBQUlVLENBQUMsR0FBR2IsVUFBVSxDQUFDTSxNQUFYLEdBQW9CLENBQWpDLEVBQW9DTyxDQUFDLElBQUksQ0FBekMsRUFBNENBLENBQUMsRUFBN0MsRUFBaUQsSUFBSUgsQ0FBQyxHQUFHVixVQUFVLENBQUNhLENBQUQsQ0FBbEIsRUFBdUJOLENBQUMsR0FBRyxDQUFDSCxDQUFDLEdBQUcsQ0FBSixHQUFRTSxDQUFDLENBQUNILENBQUQsQ0FBVCxHQUFlSCxDQUFDLEdBQUcsQ0FBSixHQUFRTSxDQUFDLENBQUNULE1BQUQsRUFBU0MsR0FBVCxFQUFjSyxDQUFkLENBQVQsR0FBNEJHLENBQUMsQ0FBQ1QsTUFBRCxFQUFTQyxHQUFULENBQTdDLEtBQStESyxDQUFuRTtBQUM3RSxTQUFPSCxDQUFDLEdBQUcsQ0FBSixJQUFTRyxDQUFULElBQWNDLE1BQU0sQ0FBQ00sY0FBUCxDQUFzQmIsTUFBdEIsRUFBOEJDLEdBQTlCLEVBQW1DSyxDQUFuQyxDQUFkLEVBQXFEQSxDQUE1RDtBQUNILENBTEQ7O0FBTUFDLE1BQU0sQ0FBQ00sY0FBUCxDQUFzQkMsT0FBdEIsRUFBK0IsWUFBL0IsRUFBNkM7QUFBRUMsRUFBQUEsS0FBSyxFQUFFO0FBQVQsQ0FBN0MsRSxDQUNBOztBQUNBLE1BQU1DLFdBQVcsR0FBR0MsT0FBTyxDQUFDLFdBQUQsQ0FBM0I7O0FBQ0EsTUFBTUMsUUFBUSxHQUFHRCxPQUFPLENBQUMsUUFBRCxDQUF4Qjs7QUFDQSxJQUFJRSxjQUFjLEdBQUcsTUFBTUEsY0FBTixDQUFxQjtBQUN0QztBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsZUFBZSxDQUFDQyxPQUFELEVBQVVDLFFBQVYsRUFBb0JDLE9BQXBCLEVBQTZCO0FBQ3hDLFdBQU9MLFFBQVEsQ0FBQ00sUUFBVCxDQUFrQkosZUFBbEIsQ0FBa0NDLE9BQWxDLEVBQTJDQyxRQUEzQyxFQUFxREMsT0FBckQsQ0FBUDtBQUNIO0FBQ0Q7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBQ0lFLEVBQUFBLHlCQUF5QixDQUFDSixPQUFELEVBQVVDLFFBQVYsRUFBb0JDLE9BQXBCLEVBQTZCO0FBQ2xELFdBQU9MLFFBQVEsQ0FBQ00sUUFBVCxDQUFrQkMseUJBQWxCLENBQTRDSixPQUE1QyxFQUFxREMsUUFBckQsRUFBK0RDLE9BQS9ELENBQVA7QUFDSDtBQUNEO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUNJRyxFQUFBQSxjQUFjLENBQUNMLE9BQUQsRUFBVSxHQUFHTSxJQUFiLEVBQW1CO0FBQzdCLFdBQU9ULFFBQVEsQ0FBQ00sUUFBVCxDQUFrQkUsY0FBbEIsQ0FBaUNMLE9BQWpDLEVBQTBDLEdBQUdNLElBQTdDLENBQVA7QUFDSDtBQUNEO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFDSUMsRUFBQUEsV0FBVyxDQUFDQyxjQUFELEVBQWlCO0FBQ3hCLFdBQU9YLFFBQVEsQ0FBQ00sUUFBVCxDQUFrQkksV0FBbEIsQ0FBOEJDLGNBQTlCLENBQVA7QUFDSDs7QUEzRHFDLENBQTFDO0FBNkRBVixjQUFjLEdBQUdyQixVQUFVLENBQUMsQ0FDeEJrQixXQUFXLENBQUNjLFVBQVosRUFEd0IsQ0FBRCxFQUV4QlgsY0FGd0IsQ0FBM0I7QUFHQUwsT0FBTyxDQUFDSyxjQUFSLEdBQXlCQSxjQUF6QiIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vLyB0c2xpbnQ6ZGlzYWJsZTpuby1hbnlcbmNvbnN0IGludmVyc2lmeV8xID0gcmVxdWlyZShcImludmVyc2lmeVwiKTtcbmNvbnN0IHZzY29kZV8xID0gcmVxdWlyZShcInZzY29kZVwiKTtcbmxldCBDb21tYW5kTWFuYWdlciA9IGNsYXNzIENvbW1hbmRNYW5hZ2VyIHtcbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcnMgYSBjb21tYW5kIHRoYXQgY2FuIGJlIGludm9rZWQgdmlhIGEga2V5Ym9hcmQgc2hvcnRjdXQsXG4gICAgICogYSBtZW51IGl0ZW0sIGFuIGFjdGlvbiwgb3IgZGlyZWN0bHkuXG4gICAgICpcbiAgICAgKiBSZWdpc3RlcmluZyBhIGNvbW1hbmQgd2l0aCBhbiBleGlzdGluZyBjb21tYW5kIGlkZW50aWZpZXIgdHdpY2VcbiAgICAgKiB3aWxsIGNhdXNlIGFuIGVycm9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbW1hbmQgQSB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIGNvbW1hbmQuXG4gICAgICogQHBhcmFtIGNhbGxiYWNrIEEgY29tbWFuZCBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB0aGlzQXJnIFRoZSBgdGhpc2AgY29udGV4dCB1c2VkIHdoZW4gaW52b2tpbmcgdGhlIGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICogQHJldHVybiBEaXNwb3NhYmxlIHdoaWNoIHVucmVnaXN0ZXJzIHRoaXMgY29tbWFuZCBvbiBkaXNwb3NhbC5cbiAgICAgKi9cbiAgICByZWdpc3RlckNvbW1hbmQoY29tbWFuZCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgICAgcmV0dXJuIHZzY29kZV8xLmNvbW1hbmRzLnJlZ2lzdGVyQ29tbWFuZChjb21tYW5kLCBjYWxsYmFjaywgdGhpc0FyZyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBhIHRleHQgZWRpdG9yIGNvbW1hbmQgdGhhdCBjYW4gYmUgaW52b2tlZCB2aWEgYSBrZXlib2FyZCBzaG9ydGN1dCxcbiAgICAgKiBhIG1lbnUgaXRlbSwgYW4gYWN0aW9uLCBvciBkaXJlY3RseS5cbiAgICAgKlxuICAgICAqIFRleHQgZWRpdG9yIGNvbW1hbmRzIGFyZSBkaWZmZXJlbnQgZnJvbSBvcmRpbmFyeSBbY29tbWFuZHNdKCNjb21tYW5kcy5yZWdpc3RlckNvbW1hbmQpIGFzXG4gICAgICogdGhleSBvbmx5IGV4ZWN1dGUgd2hlbiB0aGVyZSBpcyBhbiBhY3RpdmUgZWRpdG9yIHdoZW4gdGhlIGNvbW1hbmQgaXMgY2FsbGVkLiBBbHNvLCB0aGVcbiAgICAgKiBjb21tYW5kIGhhbmRsZXIgb2YgYW4gZWRpdG9yIGNvbW1hbmQgaGFzIGFjY2VzcyB0byB0aGUgYWN0aXZlIGVkaXRvciBhbmQgdG8gYW5cbiAgICAgKiBbZWRpdF0oI1RleHRFZGl0b3JFZGl0KS1idWlsZGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbW1hbmQgQSB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIGNvbW1hbmQuXG4gICAgICogQHBhcmFtIGNhbGxiYWNrIEEgY29tbWFuZCBoYW5kbGVyIGZ1bmN0aW9uIHdpdGggYWNjZXNzIHRvIGFuIFtlZGl0b3JdKCNUZXh0RWRpdG9yKSBhbmQgYW4gW2VkaXRdKCNUZXh0RWRpdG9yRWRpdCkuXG4gICAgICogQHBhcmFtIHRoaXNBcmcgVGhlIGB0aGlzYCBjb250ZXh0IHVzZWQgd2hlbiBpbnZva2luZyB0aGUgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgKiBAcmV0dXJuIERpc3Bvc2FibGUgd2hpY2ggdW5yZWdpc3RlcnMgdGhpcyBjb21tYW5kIG9uIGRpc3Bvc2FsLlxuICAgICAqL1xuICAgIHJlZ2lzdGVyVGV4dEVkaXRvckNvbW1hbmQoY29tbWFuZCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgICAgcmV0dXJuIHZzY29kZV8xLmNvbW1hbmRzLnJlZ2lzdGVyVGV4dEVkaXRvckNvbW1hbmQoY29tbWFuZCwgY2FsbGJhY2ssIHRoaXNBcmcpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyB0aGUgY29tbWFuZCBkZW5vdGVkIGJ5IHRoZSBnaXZlbiBjb21tYW5kIGlkZW50aWZpZXIuXG4gICAgICpcbiAgICAgKiAqICpOb3RlIDE6KiBXaGVuIGV4ZWN1dGluZyBhbiBlZGl0b3IgY29tbWFuZCBub3QgYWxsIHR5cGVzIGFyZSBhbGxvd2VkIHRvXG4gICAgICogYmUgcGFzc2VkIGFzIGFyZ3VtZW50cy4gQWxsb3dlZCBhcmUgdGhlIHByaW1pdGl2ZSB0eXBlcyBgc3RyaW5nYCwgYGJvb2xlYW5gLFxuICAgICAqIGBudW1iZXJgLCBgdW5kZWZpbmVkYCwgYW5kIGBudWxsYCwgYXMgd2VsbCBhcyBbYFBvc2l0aW9uYF0oI1Bvc2l0aW9uKSwgW2BSYW5nZWBdKCNSYW5nZSksIFtgVXJpYF0oI1VyaSkgYW5kIFtgTG9jYXRpb25gXSgjTG9jYXRpb24pLlxuICAgICAqICogKk5vdGUgMjoqIFRoZXJlIGFyZSBubyByZXN0cmljdGlvbnMgd2hlbiBleGVjdXRpbmcgY29tbWFuZHMgdGhhdCBoYXZlIGJlZW4gY29udHJpYnV0ZWRcbiAgICAgKiBieSBleHRlbnNpb25zLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbW1hbmQgSWRlbnRpZmllciBvZiB0aGUgY29tbWFuZCB0byBleGVjdXRlLlxuICAgICAqIEBwYXJhbSByZXN0IFBhcmFtZXRlcnMgcGFzc2VkIHRvIHRoZSBjb21tYW5kIGZ1bmN0aW9uLlxuICAgICAqIEByZXR1cm4gQSB0aGVuYWJsZSB0aGF0IHJlc29sdmVzIHRvIHRoZSByZXR1cm5lZCB2YWx1ZSBvZiB0aGUgZ2l2ZW4gY29tbWFuZC4gYHVuZGVmaW5lZGAgd2hlblxuICAgICAqIHRoZSBjb21tYW5kIGhhbmRsZXIgZnVuY3Rpb24gZG9lc24ndCByZXR1cm4gYW55dGhpbmcuXG4gICAgICovXG4gICAgZXhlY3V0ZUNvbW1hbmQoY29tbWFuZCwgLi4ucmVzdCkge1xuICAgICAgICByZXR1cm4gdnNjb2RlXzEuY29tbWFuZHMuZXhlY3V0ZUNvbW1hbmQoY29tbWFuZCwgLi4ucmVzdCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlIHRoZSBsaXN0IG9mIGFsbCBhdmFpbGFibGUgY29tbWFuZHMuIENvbW1hbmRzIHN0YXJ0aW5nIGFuIHVuZGVyc2NvcmUgYXJlXG4gICAgICogdHJlYXRlZCBhcyBpbnRlcm5hbCBjb21tYW5kcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBmaWx0ZXJJbnRlcm5hbCBTZXQgYHRydWVgIHRvIG5vdCBzZWUgaW50ZXJuYWwgY29tbWFuZHMgKHN0YXJ0aW5nIHdpdGggYW4gdW5kZXJzY29yZSlcbiAgICAgKiBAcmV0dXJuIFRoZW5hYmxlIHRoYXQgcmVzb2x2ZXMgdG8gYSBsaXN0IG9mIGNvbW1hbmQgaWRzLlxuICAgICAqL1xuICAgIGdldENvbW1hbmRzKGZpbHRlckludGVybmFsKSB7XG4gICAgICAgIHJldHVybiB2c2NvZGVfMS5jb21tYW5kcy5nZXRDb21tYW5kcyhmaWx0ZXJJbnRlcm5hbCk7XG4gICAgfVxufTtcbkNvbW1hbmRNYW5hZ2VyID0gX19kZWNvcmF0ZShbXG4gICAgaW52ZXJzaWZ5XzEuaW5qZWN0YWJsZSgpXG5dLCBDb21tYW5kTWFuYWdlcik7XG5leHBvcnRzLkNvbW1hbmRNYW5hZ2VyID0gQ29tbWFuZE1hbmFnZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb21tYW5kTWFuYWdlci5qcy5tYXAiXX0=