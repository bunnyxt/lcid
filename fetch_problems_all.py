import urllib3
import json
import re
import time


def get_csrftoken():
    http = urllib3.PoolManager()
    r = http.request(
        'GET',
        'https://leetcode.com/problemset/all/',
        redirect=False
    )
    if r.status != 200:
        raise RuntimeError('Fail to get csrftoken! status: %d, data: %s' % (r.status, r.data))
    match_obj = re.search('csrftoken=(\S+); ', r.headers['Set-Cookie'])
    if match_obj:
        return match_obj.group(1)
    else:
        raise RuntimeError('Fail to parse csrftoken from headers! headers: %s' % r.headers)


def fetch_problems(csrftoken, limit=50):
    http = urllib3.PoolManager()
    cookie = 'csrftoken=%s' % csrftoken
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
            'skip': 0,
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
                'cookie': cookie,
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


def main():
    print('Now try get csrftoken...')
    csrftoken = get_csrftoken()
    print('Got csrftoken %s.' % csrftoken)

    print('Now try get LeetCode problems total count...')
    response_content = fetch_problems(csrftoken)
    total_count = response_content['data']['problemsetQuestionList']['total']
    print('Found %d problems in total.' % total_count)

    print('Now try fetch all %d LeetCode problems...' % total_count)
    response_content = fetch_problems(csrftoken, total_count)
    questions_all = {q['frontendQuestionId']: q for q in
                     response_content['data']['problemsetQuestionList']['questions']}
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
    print('All %d problems fetched.' % total_count)

    with open('problems_all.json', 'w') as f:
        f.write(json.dumps(questions_all))
        print('All %d problems info saved into problems_all.json file.' % total_count)


if __name__ == '__main__':
    main()
