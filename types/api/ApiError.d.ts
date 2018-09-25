export default class ApiError extends Error {
    response: any;
    constructor(response: any);
}
