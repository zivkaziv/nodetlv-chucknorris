import http from 'k6/http';
import {check, sleep} from 'k6';

const END_POINT = 'http://localhost:8000/fact'
export const options = {
    stages: [
        {duration: '10s', target: 10}, // In the first 10 seconds we'll get to 10 VUs
        {duration: '10s', target: 20}, // In the next 10 seconds we'll get to 20 VUs
        {duration: '10s', target: 20}, // In the next 10 seconds we'll stay with 20 VUs
        {duration: '10s', target: 0}, // In the next 10 seconds we'll get to 0 VUs
    ],
    thresholds: {
        http_req_failed: ["rate<0.01"], // http errors should be less than 1%
        http_req_duration: ["p(95)<400"], // 95% of requests should be below 400ms
    },
};

export default function () {
    const params = {
        headers: {
            'Authorization': '1111-2222-3333',
        },
    };
    const res = http.get(END_POINT, params);
    check(res, {'status was 200': (r) => r.status === 200});
    sleep(1);
}