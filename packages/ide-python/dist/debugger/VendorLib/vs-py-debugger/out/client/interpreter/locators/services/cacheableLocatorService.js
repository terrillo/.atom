"use strict"; // Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
}); // tslint:disable:no-any

const inversify_1 = require("inversify");

const md5 = require("md5");

const vscode_1 = require("vscode");

const types_1 = require("../../../common/application/types");

require("../../../common/extensions");

const logger_1 = require("../../../common/logger");

const types_2 = require("../../../common/types");

const async_1 = require("../../../common/utils/async");

let CacheableLocatorService = class CacheableLocatorService {
  constructor(name, serviceContainer, cachePerWorkspace = false) {
    this.serviceContainer = serviceContainer;
    this.cachePerWorkspace = cachePerWorkspace;
    this.promisesPerResource = new Map();
    this.handlersAddedToResource = new Set();
    this.locating = new vscode_1.EventEmitter();
    this.cacheKeyPrefix = `INTERPRETERS_CACHE_v2_${name}`;
  }

  get onLocating() {
    return this.locating.event;
  }

  getInterpreters(resource) {
    return __awaiter(this, void 0, void 0, function* () {
      const cacheKey = this.getCacheKey(resource);
      let deferred = this.promisesPerResource.get(cacheKey);

      if (!deferred) {
        deferred = async_1.createDeferred();
        this.promisesPerResource.set(cacheKey, deferred);
        this.addHandlersForInterpreterWatchers(cacheKey, resource).ignoreErrors();
        this.getInterpretersImplementation(resource).then(items => __awaiter(this, void 0, void 0, function* () {
          yield this.cacheInterpreters(items, resource);
          deferred.resolve(items);
        })).catch(ex => deferred.reject(ex));
        this.locating.fire(deferred.promise);
      }

      if (deferred.completed) {
        return deferred.promise;
      }

      const cachedInterpreters = this.getCachedInterpreters(resource);
      return Array.isArray(cachedInterpreters) ? cachedInterpreters : deferred.promise;
    });
  }

  addHandlersForInterpreterWatchers(cacheKey, resource) {
    return __awaiter(this, void 0, void 0, function* () {
      if (this.handlersAddedToResource.has(cacheKey)) {
        return;
      }

      this.handlersAddedToResource.add(cacheKey);
      const watchers = yield this.getInterpreterWatchers(resource);
      const disposableRegisry = this.serviceContainer.get(types_2.IDisposableRegistry);
      watchers.forEach(watcher => {
        watcher.onDidCreate(() => {
          logger_1.Logger.verbose(`Interpreter Watcher change handler for ${this.cacheKeyPrefix}`);
          this.promisesPerResource.delete(cacheKey);
          this.getInterpreters(resource).ignoreErrors();
        }, this, disposableRegisry);
      });
    });
  }

  getInterpreterWatchers(_resource) {
    return __awaiter(this, void 0, void 0, function* () {
      return [];
    });
  }

  createPersistenceStore(resource) {
    const cacheKey = this.getCacheKey(resource);
    const persistentFactory = this.serviceContainer.get(types_2.IPersistentStateFactory);

    if (this.cachePerWorkspace) {
      return persistentFactory.createWorkspacePersistentState(cacheKey, undefined);
    } else {
      return persistentFactory.createGlobalPersistentState(cacheKey, undefined);
    }
  }

  getCachedInterpreters(resource) {
    const persistence = this.createPersistenceStore(resource);

    if (!Array.isArray(persistence.value)) {
      return;
    }

    return persistence.value.map(item => {
      return Object.assign({}, item, {
        cachedEntry: true
      });
    });
  }

  cacheInterpreters(interpreters, resource) {
    return __awaiter(this, void 0, void 0, function* () {
      const persistence = this.createPersistenceStore(resource);
      yield persistence.updateValue(interpreters);
    });
  }

  getCacheKey(resource) {
    if (!resource || !this.cachePerWorkspace) {
      return this.cacheKeyPrefix;
    } // Ensure we have separate caches per workspace where necessary.Î


    const workspaceService = this.serviceContainer.get(types_1.IWorkspaceService);

    if (!Array.isArray(workspaceService.workspaceFolders)) {
      return this.cacheKeyPrefix;
    }

    const workspace = workspaceService.getWorkspaceFolder(resource);
    return workspace ? `${this.cacheKeyPrefix}:${md5(workspace.uri.fsPath)}` : this.cacheKeyPrefix;
  }

};
CacheableLocatorService = __decorate([inversify_1.injectable(), __param(0, inversify_1.unmanaged()), __param(1, inversify_1.unmanaged()), __param(2, inversify_1.unmanaged())], CacheableLocatorService);
exports.CacheableLocatorService = CacheableLocatorService;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNhY2hlYWJsZUxvY2F0b3JTZXJ2aWNlLmpzIl0sIm5hbWVzIjpbIl9fZGVjb3JhdGUiLCJkZWNvcmF0b3JzIiwidGFyZ2V0Iiwia2V5IiwiZGVzYyIsImMiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJyIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiZCIsIlJlZmxlY3QiLCJkZWNvcmF0ZSIsImkiLCJkZWZpbmVQcm9wZXJ0eSIsIl9fcGFyYW0iLCJwYXJhbUluZGV4IiwiZGVjb3JhdG9yIiwiX19hd2FpdGVyIiwidGhpc0FyZyIsIl9hcmd1bWVudHMiLCJQIiwiZ2VuZXJhdG9yIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJmdWxmaWxsZWQiLCJ2YWx1ZSIsInN0ZXAiLCJuZXh0IiwiZSIsInJlamVjdGVkIiwicmVzdWx0IiwiZG9uZSIsInRoZW4iLCJhcHBseSIsImV4cG9ydHMiLCJpbnZlcnNpZnlfMSIsInJlcXVpcmUiLCJtZDUiLCJ2c2NvZGVfMSIsInR5cGVzXzEiLCJsb2dnZXJfMSIsInR5cGVzXzIiLCJhc3luY18xIiwiQ2FjaGVhYmxlTG9jYXRvclNlcnZpY2UiLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJzZXJ2aWNlQ29udGFpbmVyIiwiY2FjaGVQZXJXb3Jrc3BhY2UiLCJwcm9taXNlc1BlclJlc291cmNlIiwiTWFwIiwiaGFuZGxlcnNBZGRlZFRvUmVzb3VyY2UiLCJTZXQiLCJsb2NhdGluZyIsIkV2ZW50RW1pdHRlciIsImNhY2hlS2V5UHJlZml4Iiwib25Mb2NhdGluZyIsImV2ZW50IiwiZ2V0SW50ZXJwcmV0ZXJzIiwicmVzb3VyY2UiLCJjYWNoZUtleSIsImdldENhY2hlS2V5IiwiZGVmZXJyZWQiLCJnZXQiLCJjcmVhdGVEZWZlcnJlZCIsInNldCIsImFkZEhhbmRsZXJzRm9ySW50ZXJwcmV0ZXJXYXRjaGVycyIsImlnbm9yZUVycm9ycyIsImdldEludGVycHJldGVyc0ltcGxlbWVudGF0aW9uIiwiaXRlbXMiLCJjYWNoZUludGVycHJldGVycyIsImNhdGNoIiwiZXgiLCJmaXJlIiwicHJvbWlzZSIsImNvbXBsZXRlZCIsImNhY2hlZEludGVycHJldGVycyIsImdldENhY2hlZEludGVycHJldGVycyIsIkFycmF5IiwiaXNBcnJheSIsImhhcyIsImFkZCIsIndhdGNoZXJzIiwiZ2V0SW50ZXJwcmV0ZXJXYXRjaGVycyIsImRpc3Bvc2FibGVSZWdpc3J5IiwiSURpc3Bvc2FibGVSZWdpc3RyeSIsImZvckVhY2giLCJ3YXRjaGVyIiwib25EaWRDcmVhdGUiLCJMb2dnZXIiLCJ2ZXJib3NlIiwiZGVsZXRlIiwiX3Jlc291cmNlIiwiY3JlYXRlUGVyc2lzdGVuY2VTdG9yZSIsInBlcnNpc3RlbnRGYWN0b3J5IiwiSVBlcnNpc3RlbnRTdGF0ZUZhY3RvcnkiLCJjcmVhdGVXb3Jrc3BhY2VQZXJzaXN0ZW50U3RhdGUiLCJ1bmRlZmluZWQiLCJjcmVhdGVHbG9iYWxQZXJzaXN0ZW50U3RhdGUiLCJwZXJzaXN0ZW5jZSIsIm1hcCIsIml0ZW0iLCJhc3NpZ24iLCJjYWNoZWRFbnRyeSIsImludGVycHJldGVycyIsInVwZGF0ZVZhbHVlIiwid29ya3NwYWNlU2VydmljZSIsIklXb3Jrc3BhY2VTZXJ2aWNlIiwid29ya3NwYWNlRm9sZGVycyIsIndvcmtzcGFjZSIsImdldFdvcmtzcGFjZUZvbGRlciIsInVyaSIsImZzUGF0aCIsImluamVjdGFibGUiLCJ1bm1hbmFnZWQiXSwibWFwcGluZ3MiOiJBQUFBLGEsQ0FDQTtBQUNBOztBQUNBLElBQUlBLFVBQVUsR0FBSSxVQUFRLFNBQUtBLFVBQWQsSUFBNkIsVUFBVUMsVUFBVixFQUFzQkMsTUFBdEIsRUFBOEJDLEdBQTlCLEVBQW1DQyxJQUFuQyxFQUF5QztBQUNuRixNQUFJQyxDQUFDLEdBQUdDLFNBQVMsQ0FBQ0MsTUFBbEI7QUFBQSxNQUEwQkMsQ0FBQyxHQUFHSCxDQUFDLEdBQUcsQ0FBSixHQUFRSCxNQUFSLEdBQWlCRSxJQUFJLEtBQUssSUFBVCxHQUFnQkEsSUFB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cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG4vLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbnZhciBfX3BhcmFtID0gKHRoaXMgJiYgdGhpcy5fX3BhcmFtKSB8fCBmdW5jdGlvbiAocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIGtleSkgeyBkZWNvcmF0b3IodGFyZ2V0LCBrZXksIHBhcmFtSW5kZXgpOyB9XG59O1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZShyZXN1bHQudmFsdWUpOyB9KS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vLyB0c2xpbnQ6ZGlzYWJsZTpuby1hbnlcbmNvbnN0IGludmVyc2lmeV8xID0gcmVxdWlyZShcImludmVyc2lmeVwiKTtcbmNvbnN0IG1kNSA9IHJlcXVpcmUoXCJtZDVcIik7XG5jb25zdCB2c2NvZGVfMSA9IHJlcXVpcmUoXCJ2c2NvZGVcIik7XG5jb25zdCB0eXBlc18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2NvbW1vbi9hcHBsaWNhdGlvbi90eXBlc1wiKTtcbnJlcXVpcmUoXCIuLi8uLi8uLi9jb21tb24vZXh0ZW5zaW9uc1wiKTtcbmNvbnN0IGxvZ2dlcl8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2NvbW1vbi9sb2dnZXJcIik7XG5jb25zdCB0eXBlc18yID0gcmVxdWlyZShcIi4uLy4uLy4uL2NvbW1vbi90eXBlc1wiKTtcbmNvbnN0IGFzeW5jXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vY29tbW9uL3V0aWxzL2FzeW5jXCIpO1xubGV0IENhY2hlYWJsZUxvY2F0b3JTZXJ2aWNlID0gY2xhc3MgQ2FjaGVhYmxlTG9jYXRvclNlcnZpY2Uge1xuICAgIGNvbnN0cnVjdG9yKG5hbWUsIHNlcnZpY2VDb250YWluZXIsIGNhY2hlUGVyV29ya3NwYWNlID0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5zZXJ2aWNlQ29udGFpbmVyID0gc2VydmljZUNvbnRhaW5lcjtcbiAgICAgICAgdGhpcy5jYWNoZVBlcldvcmtzcGFjZSA9IGNhY2hlUGVyV29ya3NwYWNlO1xuICAgICAgICB0aGlzLnByb21pc2VzUGVyUmVzb3VyY2UgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuaGFuZGxlcnNBZGRlZFRvUmVzb3VyY2UgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMubG9jYXRpbmcgPSBuZXcgdnNjb2RlXzEuRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMuY2FjaGVLZXlQcmVmaXggPSBgSU5URVJQUkVURVJTX0NBQ0hFX3YyXyR7bmFtZX1gO1xuICAgIH1cbiAgICBnZXQgb25Mb2NhdGluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYXRpbmcuZXZlbnQ7XG4gICAgfVxuICAgIGdldEludGVycHJldGVycyhyZXNvdXJjZSkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgY29uc3QgY2FjaGVLZXkgPSB0aGlzLmdldENhY2hlS2V5KHJlc291cmNlKTtcbiAgICAgICAgICAgIGxldCBkZWZlcnJlZCA9IHRoaXMucHJvbWlzZXNQZXJSZXNvdXJjZS5nZXQoY2FjaGVLZXkpO1xuICAgICAgICAgICAgaWYgKCFkZWZlcnJlZCkge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkID0gYXN5bmNfMS5jcmVhdGVEZWZlcnJlZCgpO1xuICAgICAgICAgICAgICAgIHRoaXMucHJvbWlzZXNQZXJSZXNvdXJjZS5zZXQoY2FjaGVLZXksIGRlZmVycmVkKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEhhbmRsZXJzRm9ySW50ZXJwcmV0ZXJXYXRjaGVycyhjYWNoZUtleSwgcmVzb3VyY2UpXG4gICAgICAgICAgICAgICAgICAgIC5pZ25vcmVFcnJvcnMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdldEludGVycHJldGVyc0ltcGxlbWVudGF0aW9uKHJlc291cmNlKVxuICAgICAgICAgICAgICAgICAgICAudGhlbigoaXRlbXMpID0+IF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgICAgICAgICAgeWllbGQgdGhpcy5jYWNoZUludGVycHJldGVycyhpdGVtcywgcmVzb3VyY2UpO1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGl0ZW1zKTtcbiAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGV4ID0+IGRlZmVycmVkLnJlamVjdChleCkpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9jYXRpbmcuZmlyZShkZWZlcnJlZC5wcm9taXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkZWZlcnJlZC5jb21wbGV0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNhY2hlZEludGVycHJldGVycyA9IHRoaXMuZ2V0Q2FjaGVkSW50ZXJwcmV0ZXJzKHJlc291cmNlKTtcbiAgICAgICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KGNhY2hlZEludGVycHJldGVycykgPyBjYWNoZWRJbnRlcnByZXRlcnMgOiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYWRkSGFuZGxlcnNGb3JJbnRlcnByZXRlcldhdGNoZXJzKGNhY2hlS2V5LCByZXNvdXJjZSkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaGFuZGxlcnNBZGRlZFRvUmVzb3VyY2UuaGFzKGNhY2hlS2V5KSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaGFuZGxlcnNBZGRlZFRvUmVzb3VyY2UuYWRkKGNhY2hlS2V5KTtcbiAgICAgICAgICAgIGNvbnN0IHdhdGNoZXJzID0geWllbGQgdGhpcy5nZXRJbnRlcnByZXRlcldhdGNoZXJzKHJlc291cmNlKTtcbiAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2FibGVSZWdpc3J5ID0gdGhpcy5zZXJ2aWNlQ29udGFpbmVyLmdldCh0eXBlc18yLklEaXNwb3NhYmxlUmVnaXN0cnkpO1xuICAgICAgICAgICAgd2F0Y2hlcnMuZm9yRWFjaCh3YXRjaGVyID0+IHtcbiAgICAgICAgICAgICAgICB3YXRjaGVyLm9uRGlkQ3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyXzEuTG9nZ2VyLnZlcmJvc2UoYEludGVycHJldGVyIFdhdGNoZXIgY2hhbmdlIGhhbmRsZXIgZm9yICR7dGhpcy5jYWNoZUtleVByZWZpeH1gKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9taXNlc1BlclJlc291cmNlLmRlbGV0ZShjYWNoZUtleSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0SW50ZXJwcmV0ZXJzKHJlc291cmNlKS5pZ25vcmVFcnJvcnMoKTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzLCBkaXNwb3NhYmxlUmVnaXNyeSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldEludGVycHJldGVyV2F0Y2hlcnMoX3Jlc291cmNlKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjcmVhdGVQZXJzaXN0ZW5jZVN0b3JlKHJlc291cmNlKSB7XG4gICAgICAgIGNvbnN0IGNhY2hlS2V5ID0gdGhpcy5nZXRDYWNoZUtleShyZXNvdXJjZSk7XG4gICAgICAgIGNvbnN0IHBlcnNpc3RlbnRGYWN0b3J5ID0gdGhpcy5zZXJ2aWNlQ29udGFpbmVyLmdldCh0eXBlc18yLklQZXJzaXN0ZW50U3RhdGVGYWN0b3J5KTtcbiAgICAgICAgaWYgKHRoaXMuY2FjaGVQZXJXb3Jrc3BhY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBwZXJzaXN0ZW50RmFjdG9yeS5jcmVhdGVXb3Jrc3BhY2VQZXJzaXN0ZW50U3RhdGUoY2FjaGVLZXksIHVuZGVmaW5lZCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcGVyc2lzdGVudEZhY3RvcnkuY3JlYXRlR2xvYmFsUGVyc2lzdGVudFN0YXRlKGNhY2hlS2V5LCB1bmRlZmluZWQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldENhY2hlZEludGVycHJldGVycyhyZXNvdXJjZSkge1xuICAgICAgICBjb25zdCBwZXJzaXN0ZW5jZSA9IHRoaXMuY3JlYXRlUGVyc2lzdGVuY2VTdG9yZShyZXNvdXJjZSk7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShwZXJzaXN0ZW5jZS52YWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGVyc2lzdGVuY2UudmFsdWUubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGl0ZW0sIHsgY2FjaGVkRW50cnk6IHRydWUgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjYWNoZUludGVycHJldGVycyhpbnRlcnByZXRlcnMsIHJlc291cmNlKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBjb25zdCBwZXJzaXN0ZW5jZSA9IHRoaXMuY3JlYXRlUGVyc2lzdGVuY2VTdG9yZShyZXNvdXJjZSk7XG4gICAgICAgICAgICB5aWVsZCBwZXJzaXN0ZW5jZS51cGRhdGVWYWx1ZShpbnRlcnByZXRlcnMpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0Q2FjaGVLZXkocmVzb3VyY2UpIHtcbiAgICAgICAgaWYgKCFyZXNvdXJjZSB8fCAhdGhpcy5jYWNoZVBlcldvcmtzcGFjZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVLZXlQcmVmaXg7XG4gICAgICAgIH1cbiAgICAgICAgLy8gRW5zdXJlIHdlIGhhdmUgc2VwYXJhdGUgY2FjaGVzIHBlciB3b3Jrc3BhY2Ugd2hlcmUgbmVjZXNzYXJ5LsOOXG4gICAgICAgIGNvbnN0IHdvcmtzcGFjZVNlcnZpY2UgPSB0aGlzLnNlcnZpY2VDb250YWluZXIuZ2V0KHR5cGVzXzEuSVdvcmtzcGFjZVNlcnZpY2UpO1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkod29ya3NwYWNlU2VydmljZS53b3Jrc3BhY2VGb2xkZXJzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVLZXlQcmVmaXg7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgd29ya3NwYWNlID0gd29ya3NwYWNlU2VydmljZS5nZXRXb3Jrc3BhY2VGb2xkZXIocmVzb3VyY2UpO1xuICAgICAgICByZXR1cm4gd29ya3NwYWNlID8gYCR7dGhpcy5jYWNoZUtleVByZWZpeH06JHttZDUod29ya3NwYWNlLnVyaS5mc1BhdGgpfWAgOiB0aGlzLmNhY2hlS2V5UHJlZml4O1xuICAgIH1cbn07XG5DYWNoZWFibGVMb2NhdG9yU2VydmljZSA9IF9fZGVjb3JhdGUoW1xuICAgIGludmVyc2lmeV8xLmluamVjdGFibGUoKSxcbiAgICBfX3BhcmFtKDAsIGludmVyc2lmeV8xLnVubWFuYWdlZCgpKSxcbiAgICBfX3BhcmFtKDEsIGludmVyc2lmeV8xLnVubWFuYWdlZCgpKSxcbiAgICBfX3BhcmFtKDIsIGludmVyc2lmeV8xLnVubWFuYWdlZCgpKVxuXSwgQ2FjaGVhYmxlTG9jYXRvclNlcnZpY2UpO1xuZXhwb3J0cy5DYWNoZWFibGVMb2NhdG9yU2VydmljZSA9IENhY2hlYWJsZUxvY2F0b3JTZXJ2aWNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y2FjaGVhYmxlTG9jYXRvclNlcnZpY2UuanMubWFwIl19