export default class ApiError extends Error {
    constructor(response) {
        super();
        this.name = 'ApiError';
        this.message = getErrorDescription(response);
        this.response = response;
    }
}
function getErrorDescription(response) {
    let description = '';
    if (response.body && response.body.errors) {
        for (const error of response.body.errors) {
            description += (error.detail || error) + '\n';
        }
    }
    else if (response.body && response.body.exception) {
        description = response.body.exception;
    }
    else {
        description = response.statusText || response + '';
    }
    return description;
}
//# sourceMappingURL=ApiError.js.map