(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function stopWords() {
  var stopWord = "a about above after again against all am an and any are aren't as at be because been before being below between both but by can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from further had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm i've if in into is isn't it it's its itself let's me more most mustn't my myself no nor not of off on once only or other ought our ours ourselves out over own same shan't she she'd she'll she's should shouldn't so some such than that that's the their theirs them themselves then there there's these they they'd they'll they're they've this those through to too under until up very was wasn't we we'd we'll we're we've were weren't what what's when when's where where's which while who who's whom why why's with won't would wouldn't you you'd you'll you're you've your yours yourself yourselves"

  return new Set(stopWord.split(' '))
}

module.exports = stopWords()

},{}],2:[function(require,module,exports){
//SUMMARY BOT
//CAMDEN KO
//use summaryBot.
/*eslint-env node*/
/*eslint-env es6*/
//constructor for a summaryBot
//filter out common words?

const Vertex = require('./summaryBotVertex.js')
const stopWords = require('./stopWords.js')

function summaryBot() {
  this.verticies = []
  this.dampeningFactor = .85
  this.numVerticies = 0
  this.originalSentences = []
  this.filteredSentences = []
  this.errorThreshold = .01
  this.unconnectedVerticies = new Set()
  this.infoOnLastRun = {}
}

summaryBot.prototype.summary = function () {
  if (Object.keys(this.infoOnLastRun).length) {
    let origNumWords = this.originalSentences.join(' ').split(' ').length

    return (`

    Original Number of Lines: ${this.originalSentences.length}
    Original Number of Words: ${origNumWords}
    Condensed Number of Lines: ${this.infoOnLastRun.numLines}
    Condensed Number of Words: ${this.infoOnLastRun.numWords}
    % workds kept: ${Math.round(100 * this.infoOnLastRun.numWords / origNumWords * 100) / 100}%
    Error: ${Math.round(10000 * this.infoOnLastRun.err) / 100}%
    `)
  }
}

summaryBot.prototype.run = function (text, numReturnSentences, testStatistics = false) {
  if (typeof (text) !== 'string' || typeof (numReturnSentences) !== 'number') {
    throw new TypeError('ensure that you pass valild values into summaryBot.prototype.run')
  }

  this._proccessString(text)
  this._initialize()
  let lastV0
  let curV0
  let errorLevel = 10
  while (errorLevel > this.errorThreshold) {
    this._updateAllVertexWeights()
    if (!curV0) {
      curV0 = this.verticies[0].weight
    } else {
      lastV0 = curV0
      curV0 = this.verticies[0].weight
      errorLevel = Math.abs(curV0 - lastV0)
    }
  }

  let output = this.getTopSentences(numReturnSentences)

  this.infoOnLastRun = {
    err: errorLevel,
    numLines: numReturnSentences,
    numWords: output.split(' ').length
  }
  if (testStatistics) {
    output += this.summary()
  }
  return output
}

summaryBot.prototype._findBestNumSentences = function() {
  if(this.verticies.length <= 3) {
    return this.verticies.length
  }
  const max = this.verticies[0]
  let vertex = 1
  while (this.verticies[vertex] && this.verticies[vertex] > max - 0.5) {
    vertex++
  }
  return vertex
}
//returns the error between last run
summaryBot.prototype.getTopSentences = function (numSentences) {
  let out
  this._sortVerticiesByWeight()

  let topSentencesArr = []
  if (!numSentences) {
    numSentences = this._findBestNumSentences()
  }
  if (numSentences > this.numVerticies) {
    return this.originalSentences.join('.')
  } else {
    for (let sentenceOut = 0; sentenceOut < numSentences; sentenceOut++) {
      topSentencesArr.push(this.verticies[sentenceOut])
    }
    topSentencesArr.sort(function (a, b) {
      if (a.name < b.name) return -1
      return 1
    })
    out = topSentencesArr.map(function (vert) {
      return this.originalSentences[vert.name]
    }.bind(this))
  }
  if (topSentencesArr.some(vert => vert.name === this.originalSentences.length - 1)) {
    return out.join('. ')
  }
  return out.join('. ') + '.'
}

//will properly create graph
summaryBot.prototype._proccessString = function (text) {
  this.originalSentences = text.split(/[.|?|!] /)
  for (let sentence = 0; sentence < this.originalSentences.length; sentence++) {
    this.filteredSentences[sentence] = this.originalSentences[sentence].replace(/[^a-zA-Z0-9 \']/g, " ")
  }

  this.filteredSentences = this.filteredSentences.filter(function (content) {
    return content != '';
  })

  for (let sentence = 0; sentence < this.filteredSentences.length; sentence++) {
    this._addVertex(this.filteredSentences[sentence].toLowerCase().split(' ').filter((word) => word && word.length !== 1 && !stopWords.has(word)))
  }
}

//adds vertex
summaryBot.prototype._addVertex = function (wordArr) {
  this.verticies.push(new Vertex(this.numVerticies++, wordArr))
}

//sets the similarity edge weights for each node
summaryBot.prototype._initialize = function () {
  //update edge weight
  let similarity
  for (let vertexNum = 0; vertexNum < this.verticies.length - 1; vertexNum++) {
    for (let innerVertex = vertexNum + 1; innerVertex < this.verticies.length; innerVertex++) {
      similarity = this._findSimilarity(this.verticies[vertexNum], this.verticies[innerVertex])
      this.verticies[vertexNum].connection(innerVertex, similarity)
      this.verticies[innerVertex].connection(vertexNum, similarity)
    }
  }
}

summaryBot.prototype._updateAllVertexWeights = function () {
  let totalEdgeWeights = this._getEdgeTotals()
  var tempSum = 0
  for (let vertexNum = 0; vertexNum < this.numVerticies; vertexNum++) {
    for (let otherVertex = 0; otherVertex < this.numVerticies; otherVertex++) {
      if (otherVertex !== vertexNum && !this.unconnectedVerticies.has(otherVertex)) {
        tempSum += this.verticies[vertexNum].edge[otherVertex] / totalEdgeWeights[otherVertex] * this.verticies[otherVertex].weight
      }
    }
    this.verticies[vertexNum].weight = (1 - this.dampeningFactor) + this.dampeningFactor * tempSum
    tempSum = 0
  }
}

summaryBot.prototype._getEdgeTotals = function () {
  let out = []
  let tempSum = 0
  for (let vertexNum = 0; vertexNum < this.numVerticies; vertexNum++) {
    tempSum = 0
    for (let edgeN in this.verticies[vertexNum].edge) {
      tempSum += this.verticies[vertexNum].edge[edgeN]
    }
    //if this node is unrelated set weight to 0
    if (!tempSum) {
      this.verticies[vertexNum].weight = 0
      this.unconnectedVerticies.add(vertexNum)
    }
    out.push(tempSum)
  }
  return out
}
//calculates the similarity between two verticies (edge weight)
//in: vertex obj
summaryBot.prototype._findSimilarity = function (vert1, vert2) {
  let overlap = 0
  for (let word in vert1.words){
    if (vert2.words[word]){
      overlap += Math.pow(vert1.words[word] * vert2.words[word], 0.7)
    }
  }
  return overlap / (Math.log(vert1.numWords) + Math.log(vert2.numWords))
}

summaryBot.prototype._sortVerticiesByWeight = function () {
  this.verticies.sort(function (a, b) {
    if (a.weight < b.weight) return 1
    if (a.weight > b.weight) return -1
    return 0
  })
}
module.exports = summaryBot

},{"./stopWords.js":1,"./summaryBotVertex.js":3}],3:[function(require,module,exports){
//Vertex for summaryBot sentence graph
//Camden ko

//vertex constructor
/*eslint-env node*/
/*eslint-env es6*/

function vertex(name, arrWords) {
  this.name = name
  this.edge = {} //{name: edge weight}
  this.weight = Math.floor(Math.random() * 10) + 1; //1-10
  this.words = {} //{word: count}
  for (let word = 0; word < arrWords.length; word++){
    if (this.words[arrWords[word]]){
      this.words[arrWords[word]]++
    }
    else {
      this.words[arrWords[word]] = 1
    }
  }
  this.numWords = 0
  for (let word in this.words){
    this.numWords += this.words[word]
  }
}

//adds to edge the connection
vertex.prototype.connection = function (connectName, weight) {
  this.edge[connectName] = weight
}


module.exports = vertex

},{}],4:[function(require,module,exports){
const SummaryBot = require('summarybot')
const summarizer = new SummaryBot()

function Sum(){
  const text = document.getElementById('input').value ;
  const output= SummaryBot(text,5) 
    return output;
}

document.getElementById('output').innerHTML = Sum()

},{"summarybot":2}]},{},[4]);
