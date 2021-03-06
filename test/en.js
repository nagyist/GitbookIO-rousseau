var _ = require("lodash");
var should = require("should");

var rousseau = require("../lib");
var english = require("../lib/en/english");

function testRousseau(text, opts, done, fn) {
    rousseau(text, opts || {}, function(err, results) {
        if (err) return done(err);
        try {
            fn(results);
            done();
        } catch(err) {
            done(err);
        }
    });
}


describe("English", function() {
    describe("Sentences Tokeniser", function() {
        it("should split correctly", function() {
            var sentences = english.sentences()("First. Second.");
            _.pluck(sentences, "value").should.be.eql(["First.", "Second."]);

            sentences[0].index.should.be.equal(0);
            sentences[0].offset.should.be.equal(6);

            sentences[1].index.should.be.equal(7);
            sentences[1].offset.should.be.equal(7);
        });

        it("should handle urls", function() {
            var sentences = english.sentences()("Google is accessible at https://www.google.fr.");
            sentences.length.should.be.equal(1);
        });

        it("should handle abbreviation (1)", function() {
            var sentences = english.sentences()("On Jan. 20, former Sen. Barack Obama became the 44th President of the U.S. Millions attended the Inauguration.");
            sentences.length.should.be.equal(2);
        });

        it("should handle abbreviation (2)", function() {
            var sentences = english.sentences()("Sen. Barack Obama became the 44th President of the US. Millions attended.");
            sentences.length.should.be.equal(2);
        });

        it("should handle abbreviation (3)", function() {
            var sentences = english.sentences()("Barack Obama, previously Sen. of lorem ipsum, became the 44th President of the U.S. Millions attended.");
            sentences.length.should.be.equal(2);
        });

        it("should handle dot in middle of word if followed by capital letter", function() {
            var sentences = english.sentences()("Hello Barney.The bird in the word.");
            sentences.length.should.be.equal(2);
        });

        it("should handle question- and exlamation mark", function() {
            var sentences = english.sentences()("Hello this is my first sentence? There is also a second! A third");
            sentences.length.should.be.equal(3);
        });

        it("should handle emails", function() {
            var sentences = english.sentences()("send me an email: gg@gggg.kk");
            sentences.length.should.be.equal(1);
        });

        it("should handle newline as boundaries", function() {
            var sentences = english.sentences()("This is my first sentence\nSecond");
            sentences.length.should.be.equal(2);

            sentences[0].index.should.be.equal(0);
            sentences[0].offset.should.be.equal(25);

            sentences[1].index.should.be.equal(26);
            sentences[1].offset.should.be.equal(6);
        });
    });

    describe("Adverbs", function() {
        it("should detect", function(done) {
            testRousseau("Allegedly, this sentence is terrible.", {
                only: ["adverbs"]
            }, done, function(results) {
                results.should.have.length(1);
                results[0].type.should.be.exactly("adverbs");
            });
        });
    });

    describe("Lexical Illusions", function() {
        it("should detect", function(done) {
            testRousseau("the the", {
                only: ["lexical-illusion"]
            }, done, function(results) {
                results.should.have.length(1);
                results[0].type.should.be.exactly("lexical-illusion");
                results[0].index.should.be.exactly(4);
            });
        });

        it("should split correctly sentences", function(done) {
            testRousseau("offer to sell, sell", {
                only: ["lexical-illusion"]
            }, done, function(results) {
                results.should.have.length(0);
            });
        });
    });

    describe("Passive", function() {
        describe("-ed", function(done) {
            it("should detect", function(done) {
                testRousseau("He was judged.", {
                    only: ["passive"]
                }, done, function(results) {
                    results.should.have.length(1);
                    results[0].type.should.be.exactly("passive");
                    results[0].index.should.be.exactly(3);
                    results[0].offset.should.be.exactly(10);
                });
            });
        });

        describe("predefined", function() {
            it("should detect and suggest replacements", function(done) {
                testRousseau("He was bitten.", {
                    only: ["passive"]
                }, done, function(results) {
                    results.should.have.length(1);
                    results[0].type.should.be.exactly("passive");
                    results[0].replacements.length.should.be.exactly(1);
                });
            });
        });
    });

    describe("Readibility", function() {
        var TEXT =
            // Hard to read
            "Rousseau highlights long, complex sentences and common errors;"
            + " if you see a warning highlight, shorten the sentence or split it."

            // Very hard to read
            + "If you see an error highlight, your sentence is so dense and complicated that your readers"
            + " will get lost trying to follow its meandering, splitting logic —"
            + " try editing this sentence to remove the error.";

        it("should detect", function(done) {
            testRousseau(TEXT, {
                only: ["readibility"]
            }, done, function(results) {
                results.should.have.length(2);

                results[0].type.should.be.exactly("readibility");
                results[0].level.should.be.exactly("suggestion");

                results[1].type.should.be.exactly("readibility");
                results[1].level.should.be.exactly("warning");
            });
        });
    });

    describe("Simplicity", function() {
        it("should detect and suggest replacement", function(done) {
            testRousseau("Acquire more stars", {
                only: ["simplicity"]
            }, done, function(results) {
                results.should.have.length(1);
                results[0].type.should.be.exactly("simplicity");
                results[0].replacements.length.should.be.exactly(1);
            });
        });
    });

    describe("So", function() {
        it("should detect", function(done) {
            testRousseau("So the cat was stole.", {
                only: ["so"]
            }, done, function(results) {
                results.should.have.length(1);
                results[0].type.should.be.exactly("so");
            });
        });
    });

    describe("Weasel", function() {
        describe("List", function() {
            it("should detect", function(done) {
                testRousseau("Remarkably few developers write well.", {
                    only: ["weasel"]
                }, done, function(results) {
                    results.should.have.length(2);
                    results[0].type.should.be.exactly("weasel");
                    results[0].index.should.be.exactly(0);
                    results[0].offset.should.be.exactly(10);

                    results[1].type.should.be.exactly("weasel");
                    results[1].index.should.be.exactly(11);
                    results[1].offset.should.be.exactly(3);
                });
            });
        });

        describe("Exceptions", function() {
            it("should not detect 'too many'", function(done) {
                testRousseau("I have too many things.", {
                    only: ["weasel"]
                }, done, function(results) {
                    results.should.have.length(0);
                });
            });

            it("should not detect 'too few'", function(done) {
                testRousseau("I have too few things.", {
                    only: ["weasel"]
                }, done, function(results) {
                    results.should.have.length(0);
                });
            });
        });
    });
});

