import urllib3
import json


def fetch_problems(limit=50):
    http = urllib3.PoolManager()
    cookie = 'csrftoken=fakecsrftokenfakecsrftokenfakecsrftokenfakecsrftokenfakecsrftoken'
    data = {
        'query': 'query problemsetQuestionList($categorySlug:String,$limit:Int,$skip:Int,$filters:QuestionListFilterInput){problemsetQuestionList:questionList(categorySlug:$categorySlug limit:$limit skip:$skip filters:$filters){total:totalNum questions:data{acRate difficulty freqBar frontendQuestionId:questionFrontendId isFavor paidOnly:isPaidOnly status title titleSlug topicTags{name id slug}hasSolution hasVideoSolution}}}',
        'variables': {
            'categorySlug': '',
            'skip': 0,
            'limit': limit,
            'filters': {},
        },
    }
    encoded_data = json.dumps(data).encode('utf-8')
    r = http.request(
        'POST',
        'https://leetcode.com/graphql/',
        body=encoded_data,
        headers={
            'Content-Type': 'application/json',
            'cookie': cookie,
        },
    )
    if r.status != 200:
        raise RuntimeError('Fail to fetch problems! status: %d, data: %s' % (r.status, r.data))
    response_content = json.loads(r.data)
    return response_content


def main():
    print('Now try get LeetCode problems total count...')
    response_content = fetch_problems()
    total_count = response_content['data']['problemsetQuestionList']['total']
    print('Found %d problems in total.' % total_count)

    print('Now try fetch all %d LeetCode problems...' % total_count)
    response_content = fetch_problems(limit=total_count)
    questions_all = {q['frontendQuestionId']: q for q in
                     response_content['data']['problemsetQuestionList']['questions']}
    print('All %d problems fetched.' % total_count)

    with open('problems_all.json', 'w') as f:
        f.write(json.dumps(questions_all))
        print('All %d problems info saved into problems_all.json file.' % total_count)


if __name__ == '__main__':
    main()
