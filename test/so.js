var should = require("should");
var rousseau = require("../lib")

describe("So", function() {
    it("should fail for non-existant language", function(done) {
        rousseau("So the cat was stolen.", function(err, results) {
            should.not.exist(err);
            results.should.have.length(1);
            should(results[0].type).be.exactly("so");
            done();
        });
    });
})