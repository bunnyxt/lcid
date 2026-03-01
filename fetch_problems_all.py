import urllib3
import json
import time
import random
import os
from dotenv import dotenv_values

config = {
    **dotenv_values(".env"),
    **dotenv_values(".env.local"),
    **os.environ,
}

# disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


PAGE_SIZE = 100


def fetch_problems_page(cf_clearance, csrftoken, limit=PAGE_SIZE, skip=0):
    http = urllib3.PoolManager(cert_reqs='CERT_NONE')
    cookie = 'cf_clearance=%s; csrftoken=%s' % (cf_clearance, csrftoken)
    data = {
        'query': '''
            query problemsetQuestionList(
                $categorySlug:String,
                $limit:Int,
                $skip:Int,
                $filters:QuestionListFilterInput
            ) {
                problemsetQuestionList:questionList(
                    categorySlug:$categorySlug 
                    limit:$limit 
                    skip:$skip 
                    filters:$filters
                ) {
                    total:totalNum 
                    questions:data {
                        acRate 
                        difficulty 
                        likes
                        dislikes
                        stats
                        categoryTitle
                        frontendQuestionId:questionFrontendId 
                        paidOnly:isPaidOnly 
                        title 
                        titleSlug 
                        topicTags {
                            name 
                            id 
                            slug
                        }
                        hasSolution 
                        hasVideoSolution
                    }
                }
            }
        ''',
        'variables': {
            'categorySlug': '',
            'skip': skip,
            'limit': limit,
            'filters': {},
        },
    }
    encoded_data = json.dumps(data).encode('utf-8')
    retry_count = 5
    for trial in range(1, retry_count + 1):
        r = http.request(
            'POST',
            'https://leetcode.com/graphql/',
            body=encoded_data,
            headers={
                'Content-Type': 'application/json',
                'Cookie': cookie,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                'X-Csrftoken': csrftoken,
            },
        )
        if r.status == 200:
            break
        if trial < retry_count:
            print('Status %d got when fetch problems, will retry %d second(s) later...' % (r.status, trial ** 2))
            time.sleep(trial ** 2)
    if r.status != 200:
        raise RuntimeError('Fail to fetch problems! status: %d, data: %s' % (r.status, r.data))
    response_content = json.loads(r.data)
    return response_content


def fetch_all_problems(cf_clearance, csrftoken):
    first_page = fetch_problems_page(cf_clearance, csrftoken, limit=PAGE_SIZE, skip=0)
    total_count = first_page['data']['problemsetQuestionList']['total']
    all_questions = list(first_page['data']['problemsetQuestionList']['questions'])
    print('Fetched page 1: %d/%d problems' % (len(all_questions), total_count))

    skip = PAGE_SIZE
    while skip < total_count:
        page = fetch_problems_page(cf_clearance, csrftoken, limit=PAGE_SIZE, skip=skip)
        questions = page['data']['problemsetQuestionList']['questions']
        all_questions.extend(questions)
        print('Fetched page %d: %d/%d problems' % (skip // PAGE_SIZE + 1, len(all_questions), total_count))
        skip += PAGE_SIZE
        time.sleep(0.5 + random.random())

    return all_questions


def main():
    print('Now load cf_clearance and csrftoken...')
    cf_clearance = config.get("LC_CF_CLEARANCE", None)
    csrftoken = config.get("LC_CSRFTOKEN", None)
    if not cf_clearance or not csrftoken:
        raise RuntimeError('Fail to load cf_clearance and csrftoken from environ!')
    print('Got cf_clearance %s and csrftoken %s.' % (cf_clearance, csrftoken))

    print('Now fetching all LeetCode problems (paginated, %d per page)...' % PAGE_SIZE)
    all_questions = fetch_all_problems(cf_clearance, csrftoken)

    questions_all = {q['frontendQuestionId']: q for q in all_questions}
    for question_id in questions_all.keys():
        question_stats_json = questions_all[question_id]['stats']
        totalAcceptedRaw = totalSubmissionRaw = None
        try:
            question_stats_dict = json.loads(question_stats_json)
            totalAcceptedRaw = question_stats_dict['totalAcceptedRaw']
            totalSubmissionRaw = question_stats_dict['totalSubmissionRaw']
        except:
            pass
        questions_all[question_id]['totalAcceptedRaw'] = totalAcceptedRaw
        questions_all[question_id]['totalSubmissionRaw'] = totalSubmissionRaw
        del questions_all[question_id]['stats']
    print('All %d problems fetched.' % len(questions_all))

    with open('problems_all.json', 'w') as f:
        f.write(json.dumps(questions_all))
        print('All %d problems info saved into problems_all.json file.' % len(questions_all))


if __name__ == '__main__':
    main()
