"use strict";

var SampleContract = function () {
    LocalContractStorage.defineMapProperty(this, "arrayMap");
    LocalContractStorage.defineMapProperty(this, "dataMap");
    LocalContractStorage.defineProperty(this, "size");
};

SampleContract.prototype = {
    init: function () {
        this.size = 0;
    },
    set: function (key, value) {
        // if (JSON.parse(value) && JSON.parse(value).username && JSON.parse(value).username.length > 20) {
        //     throw new Error("昵称过长");
        // }
        var index = this.size;
        this.arrayMap.set(index, key);
        this.dataMap.set(key, value);
        this.size += 1;
    },

    get: function (key) {
        return this.dataMap.get(key);
    },

    len: function () {
        return this.size;
    },

    forEach: function (from, limit, offset) {
        if (this.size == 0) {
            return JSON.stringify([]);
        }
        limit = parseInt(limit);
        offset = parseInt(offset);
        if (offset > this.size) {
            throw new Error("offset is not valid");
        }
        var number = offset + limit;
        if (number > this.size) {
            number = this.size;
        }
        var result = [];
        for (var i = offset; i < number; i++) {
            var key = this.arrayMap.get(i);
            var object = this.dataMap.get(key);
            if (from == object.from && object.switch) {
                result.push(object)
            }
        }
        return JSON.stringify(result);
    },
    all: function () {
        var result = [];
        for (var i = 0; i < this.size; i++) {
            var key = this.arrayMap.get(i);
            var object = this.dataMap.get(key);
            result.push(object)
        }
        return JSON.stringify(result);
    }
};

module.exports = SampleContract;