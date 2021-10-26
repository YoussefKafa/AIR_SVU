import asyncHandler from 'express-async-handler'
import Question from '../models/questionModel.js'
import _ from 'lodash'

// @desc   Create new question
// @route  POST /api/questions
// @access Public

const createQuestion = asyncHandler(async (req, res) => {
    const {
        question,
        answer,
    } = req.body


    var answerArr = answer.split(' ')

    const question1 = new Question({
        question,
        answer,
        answerArr
    })

    const createdQuestion = await question1.save()
    res.status(201).json(createdQuestion)
})

// @desc   Get questions
// @route  GET /api/questions
// @access Public

const getQuestions = asyncHandler(async (req, res) => {

    const keyword = !req.query.keywords ? {} : {
        keywords: {
            $regex:req.query.keywords
        }
    }
    const questions = await Question.find({ ...keyword })

    res.status(200).json(questions)
})

// @desc   Get questions using binary model
// @route  GET /api/questions/search/:query
// @access Public

const search = asyncHandler(async (req, res) => {

    var queryWords = req.params.query.split('-')
    //handle 'and' search
    if (queryWords.length > 1 && queryWords[1] === 'و') {
        var results = await Question.find({
            $and: [
                { 'answerArr':{$in: queryWords[0] } },
                { 'answerArr':{$in: queryWords[2] } }
            ]
        })
        res.status(200).json(results)
        return
    }else

    //handle 'not' search
    if (queryWords.length > 1 && queryWords[1] === 'لا') {
        var results = await Question.find({
            $and: [
                { 'answerArr':{$in: queryWords[0] } },
                { 'answerArr':{$nin: queryWords[2] } }
            ]
        })
        res.status(200).json(results)
        return
    }else
     //handle 'or' search
    if (queryWords.length > 1 && queryWords[1] === 'أو') {
        var results = await Question.find({
            $or: [
                { 'answerArr':{$in: queryWords[0] } },
                { 'answerArr':{$in: queryWords[2] } }
            ]
        })
        res.status(200).json(results)
        return
    }else
    //defualt
    var regex = [];
    for (var i = 0; i < queryWords.length; i++) {
        regex[i] = new RegExp(queryWords[i]);
    }
    var results = await Question.find({"answerArr":{$in: regex}})
    res.status(200).json(results)

})

// @desc   Get questions using extended binary model
// @route  GET /api/questions/search/extended/:query
// @access Public

const extendedSearch = asyncHandler(async (req, res) => {

    const check4perfect = (result) => {
        return result.answerArr.includes(queryWords[0]) && result.answerArr.includes(queryWords[2])
    }
    const check4good = (result) => {
        return (!(result.answerArr.includes(queryWords[0]) && result.answerArr.includes(queryWords[2])) &&
            (result.answerArr.includes(queryWords[0]) || result.answerArr.includes(queryWords[2])))
    }
   var queryWords = req.params.query.split('-')
    //handle 'and' search
    if (queryWords.length > 1 && (queryWords[1] === 'و' || queryWords[1] === 'أو')) {
        var results = await Question.find({
            $or: [
                { 'answerArr':{$in: queryWords[0] } },
                { 'answerArr':{$in: queryWords[2] } }
            ]
        })
        var perfectMatch = results.filter(check4perfect)
        var goodMatch = results.filter(check4good)

        res.status(200).json({results,perfectMatch,goodMatch})
    }

})

// @desc   Get questions using Vector Space Model
// @route  GET /api/questions/search/vsm/:query
// @access Public

const vsmSearch = asyncHandler(async (req, res) => {

    // IDF

    // idf formula
    const idf = (df,n) => {
        return Math.log10(n/df)
    }
    // query terms
    var queryTermsAndWeights = req.params.query.split(';')
    // query terms 
    var queryTerms = []
    queryTermsAndWeights.map(item => {
        queryTerms.push(item.split(':')[0])
    })
    //query terms weights
    var queryTermsWeights = []
    queryTermsAndWeights.map(item => {
        queryTermsWeights.push(item.split(':')[1])
    })
    // all documents
    var docs = await Question.find({})
    // docs amount
    var n = await Question.count({})
    // all terms
    var terms = []
    docs.map(doc => {
        terms.push(doc.answerArr)
    })

    // calculate df for each term 
    var df = []
    // loop for every doc
    for (var index = 0; index < terms.length; index++) {
        //loop for each term in doc
        var arr = []
        for (var index2 = 0; index2 < terms[index].length; index2++) {
            // count how many terms[index] appears
            var counter = 0;
            docs.map(doc => {
                for (var i = 0; i < doc.answerArr.length; i++) {
                    if (doc.answerArr[i] === terms[index][index2]) {
                        counter++
                    }
                    
                }
            })
            arr.push(counter)
        }
        df.push(arr)
    }
    // calculate idf for each term in new array with same indexes
    var idfArr = []
    for (let index = 0; index < df.length; index++) {
        var arr=[]
        for (let index2 = 0; index2 < df[index].length; index2++) {
            arr.push(idf(df[index][index2],n))    
        }
        idfArr.push(arr)
    }

    // TF

    // calculate every frequency per term
    var frequencyArr = []
    for (let index = 0; index < terms.length; index++) {
        var arr = []
        for (let index2 = 0; index2 < terms[index].length; index2++) {
            var counter = 0;
            terms[index].map(term => {
                if (term === terms[index][index2]) {
                    ++counter
                }
            })
            var frequency = counter/terms[index].length
            arr.push(frequency)
        }
        frequencyArr.push(arr)
    }

    //calculate the max term frequency for each doc
    var maxFrequencyArr = [];

    for (let index = 0; index < frequencyArr.length; index++) {
        var max = 0
        for (let index2 = 0; index2 < frequencyArr[index].length; index2++) {
            frequencyArr[index].map(term => {
                if (max <= term) {
                    max=term
                }
            })
        }
        maxFrequencyArr.push(max)
    }

    //calculate tf for each term 

    var tfArr = []
    for (let index = 0; index < frequencyArr.length; index++) {
        var arr = []
        for (let index2 = 0; index2 < frequencyArr[index].length; index2++) { 
            var tf = frequencyArr[index][index2]/maxFrequencyArr[index]
            arr.push(tf)
        }
        tfArr.push(arr)
    }

    //calculate the weights for docTerms
    var wArr = [];

    for (let index = 0; index < terms.length; index++) {
        var arr = []
        for (let index2 = 0; index2 < terms[index].length; index2++) { 
            var w = tfArr[index][index2] * idfArr[index][index2]
            arr.push(w)
        }
        wArr.push(arr)
    }

    // similarity formula (Cos formula)
    const sim = (docTerms,docTermsWeights,queryTerms,queryTermsWeight) => {
        var shortenDocWeights = []
        for (let index = 0; index < queryTerms.length; index++) {
            if (docTerms.includes(queryTerms[index])) {
                var termIndex = docTerms.indexOf(queryTerms[index])
                shortenDocWeights.push(docTermsWeights[termIndex])
            } else {
                shortenDocWeights.push(0)
            }
        }
        var top = 0
        for (let index = 0; index < queryTermsWeight.length; index++) {
            top += queryTermsWeight[index] * shortenDocWeights[index]
        }

        var bottom = 0
        var docLen = 0
        var queryLen = 0
        for (let index = 0; index < queryTermsWeight.length; index++) {
            docLen += Math.pow(shortenDocWeights[index],2)
            queryLen += Math.pow(queryTermsWeight[index],2)
        }
        bottom = Math.sqrt(docLen * queryLen)
        if (isNaN(top / bottom))
            return 0;
        return top/bottom

    }

    // calculate sim between each doc and query
    var results = []
    for (let index = 0; index < terms.length; index++) {
        var obj = {}
        obj.sim = sim(docs[index].answerArr, wArr[index], queryTerms, queryTermsWeights)
        console.log(obj.sim)
        obj.doc = docs[index]
        results.push(obj)
    }




    res.status(200).json(results)

})


export { createQuestion,getQuestions,search,vsmSearch,extendedSearch }