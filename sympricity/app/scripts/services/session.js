'use strict';

angular.module('sympricityApp')
  .factory('Session', function ($resource) {
    return $resource('/api/session/');
  });
