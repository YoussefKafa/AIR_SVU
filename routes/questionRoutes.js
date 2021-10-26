import express from 'express';
import {
    createQuestion,
    extendedSearch,
    getQuestions,
    search,
    vsmSearch
} from '../controllers/questionController.js';


const router = express.Router();


router.route('/')
    .post(createQuestion)
    .get(getQuestions)

router.route('/search/:query')
    .get(search)

router.route('/search/extended/:query')
    .get(extendedSearch)

router.route('/search/vsm/:query')
    .get(vsmSearch)


export default router