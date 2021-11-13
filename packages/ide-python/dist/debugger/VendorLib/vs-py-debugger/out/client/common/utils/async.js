// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';

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

function sleep(timeout) {
  return __awaiter(this, void 0, void 0, function* () {
    return new Promise(resolve => {
      setTimeout(resolve, timeout);
    });
  });
}

exports.sleep = sleep;

class DeferredImpl {
  // tslint:disable-next-line:no-any
  constructor(scope = null) {
    this.scope = scope;
    this._resolved = false;
    this._rejected = false; // tslint:disable-next-line:promise-must-complete

    this._promise = new Promise((res, rej) => {
      this._resolve = res;
      this._reject = rej;
    });
  }

  resolve(value) {
    this._resolve.apply(this.scope ? this.scope : this, arguments);

    this._resolved = true;
  } // tslint:disable-next-line:no-any


  reject(reason) {
    this._reject.apply(this.scope ? this.scope : this, arguments);

    this._rejected = true;
  }

  get promise() {
    return this._promise;
  }

  get resolved() {
    return this._resolved;
  }

  get rejected() {
    return this._rejected;
  }

  get completed() {
    return this._rejected || this._resolved;
  }

} // tslint:disable-next-line:no-any


function createDeferred(scope = null) {
  return new DeferredImpl(scope);
}

exports.createDeferred = createDeferred;

function createDeferredFrom(...promises) {
  const deferred = createDeferred();
  Promise.all(promises).then(deferred.resolve.bind(deferred)).catch(deferred.reject.bind(deferred));
  return deferred;
}

exports.createDeferredFrom = createDeferredFrom;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzeW5jLmpzIl0sIm5hbWVzIjpbIl9fYXdhaXRlciIsInRoaXNBcmciLCJfYXJndW1lbnRzIiwiUCIsImdlbmVyYXRvciIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiZnVsZmlsbGVkIiwidmFsdWUiLCJzdGVwIiwibmV4dCIsImUiLCJyZWplY3RlZCIsInJlc3VsdCIsImRvbmUiLCJ0aGVuIiwiYXBwbHkiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImV4cG9ydHMiLCJzbGVlcCIsInRpbWVvdXQiLCJzZXRUaW1lb3V0IiwiRGVmZXJyZWRJbXBsIiwiY29uc3RydWN0b3IiLCJzY29wZSIsIl9yZXNvbHZlZCIsIl9yZWplY3RlZCIsIl9wcm9taXNlIiwicmVzIiwicmVqIiwiX3Jlc29sdmUiLCJfcmVqZWN0IiwiYXJndW1lbnRzIiwicmVhc29uIiwicHJvbWlzZSIsInJlc29sdmVkIiwiY29tcGxldGVkIiwiY3JlYXRlRGVmZXJyZWQiLCJjcmVhdGVEZWZlcnJlZEZyb20iLCJwcm9taXNlcyIsImRlZmVycmVkIiwiYWxsIiwiYmluZCIsImNhdGNoIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7O0FBQ0EsSUFBSUEsU0FBUyxHQUFJLFVBQVEsU0FBS0EsU0FBZCxJQUE0QixVQUFVQyxPQUFWLEVBQW1CQyxVQUFuQixFQUErQkMsQ0FBL0IsRUFBa0NDLFNBQWxDLEVBQTZDO0FBQ3JGLFNBQU8sS0FBS0QsQ0FBQyxLQUFLQSxDQUFDLEdBQUdFLE9BQVQsQ0FBTixFQUF5QixVQUFVQyxPQUFWLEVBQW1CQyxNQUFuQixFQUEyQjtBQUN2RCxhQUFTQyxTQUFULENBQW1CQyxLQUFuQixFQUEwQjtBQUFFLFVBQUk7QUFBRUMsUUFBQUEsSUFBSSxDQUFDTixTQUFTLENBQUNPLElBQVYsQ0FBZUYsS0FBZixDQUFELENBQUo7QUFBOEIsT0FBcEMsQ0FBcUMsT0FBT0csQ0FBUCxFQUFVO0FBQUVMLFFBQUFBLE1BQU0sQ0FBQ0ssQ0FBRCxDQUFOO0FB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QWtDbkI7OztBQUNBLFNBQVNZLGNBQVQsQ0FBd0JiLEtBQUssR0FBRyxJQUFoQyxFQUFzQztBQUNsQyxTQUFPLElBQUlGLFlBQUosQ0FBaUJFLEtBQWpCLENBQVA7QUFDSDs7QUFDRE4sT0FBTyxDQUFDbUIsY0FBUixHQUF5QkEsY0FBekI7O0FBQ0EsU0FBU0Msa0JBQVQsQ0FBNEIsR0FBR0MsUUFBL0IsRUFBeUM7QUFDckMsUUFBTUMsUUFBUSxHQUFHSCxjQUFjLEVBQS9CO0FBQ0FsQyxFQUFBQSxPQUFPLENBQUNzQyxHQUFSLENBQVlGLFFBQVosRUFDS3pCLElBREwsQ0FDVTBCLFFBQVEsQ0FBQ3BDLE9BQVQsQ0FBaUJzQyxJQUFqQixDQUFzQkYsUUFBdEIsQ0FEVixFQUVLRyxLQUZMLENBRVdILFFBQVEsQ0FBQ25DLE1BQVQsQ0FBZ0JxQyxJQUFoQixDQUFxQkYsUUFBckIsQ0FGWDtBQUdBLFNBQU9BLFFBQVA7QUFDSDs7QUFDRHRCLE9BQU8sQ0FBQ29CLGtCQUFSLEdBQTZCQSxrQkFBN0IiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cbid1c2Ugc3RyaWN0JztcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gc2xlZXAodGltZW91dCkge1xuICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgc2V0VGltZW91dChyZXNvbHZlLCB0aW1lb3V0KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5leHBvcnRzLnNsZWVwID0gc2xlZXA7XG5jbGFzcyBEZWZlcnJlZEltcGwge1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICBjb25zdHJ1Y3RvcihzY29wZSA9IG51bGwpIHtcbiAgICAgICAgdGhpcy5zY29wZSA9IHNjb3BlO1xuICAgICAgICB0aGlzLl9yZXNvbHZlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9yZWplY3RlZCA9IGZhbHNlO1xuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6cHJvbWlzZS1tdXN0LWNvbXBsZXRlXG4gICAgICAgIHRoaXMuX3Byb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3Jlc29sdmUgPSByZXM7XG4gICAgICAgICAgICB0aGlzLl9yZWplY3QgPSByZWo7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXNvbHZlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3Jlc29sdmUuYXBwbHkodGhpcy5zY29wZSA/IHRoaXMuc2NvcGUgOiB0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB0aGlzLl9yZXNvbHZlZCA9IHRydWU7XG4gICAgfVxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICByZWplY3QocmVhc29uKSB7XG4gICAgICAgIHRoaXMuX3JlamVjdC5hcHBseSh0aGlzLnNjb3BlID8gdGhpcy5zY29wZSA6IHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMuX3JlamVjdGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgZ2V0IHByb21pc2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wcm9taXNlO1xuICAgIH1cbiAgICBnZXQgcmVzb2x2ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZXNvbHZlZDtcbiAgICB9XG4gICAgZ2V0IHJlamVjdGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVqZWN0ZWQ7XG4gICAgfVxuICAgIGdldCBjb21wbGV0ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZWplY3RlZCB8fCB0aGlzLl9yZXNvbHZlZDtcbiAgICB9XG59XG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG5mdW5jdGlvbiBjcmVhdGVEZWZlcnJlZChzY29wZSA9IG51bGwpIHtcbiAgICByZXR1cm4gbmV3IERlZmVycmVkSW1wbChzY29wZSk7XG59XG5leHBvcnRzLmNyZWF0ZURlZmVycmVkID0gY3JlYXRlRGVmZXJyZWQ7XG5mdW5jdGlvbiBjcmVhdGVEZWZlcnJlZEZyb20oLi4ucHJvbWlzZXMpIHtcbiAgICBjb25zdCBkZWZlcnJlZCA9IGNyZWF0ZURlZmVycmVkKCk7XG4gICAgUHJvbWlzZS5hbGwocHJvbWlzZXMpXG4gICAgICAgIC50aGVuKGRlZmVycmVkLnJlc29sdmUuYmluZChkZWZlcnJlZCkpXG4gICAgICAgIC5jYXRjaChkZWZlcnJlZC5yZWplY3QuYmluZChkZWZlcnJlZCkpO1xuICAgIHJldHVybiBkZWZlcnJlZDtcbn1cbmV4cG9ydHMuY3JlYXRlRGVmZXJyZWRGcm9tID0gY3JlYXRlRGVmZXJyZWRGcm9tO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXN5bmMuanMubWFwIl19