class DSPromise {
    constructor(initializer) {
        this.states = {
            waiting: 'Waiting',
            resolved: 'Resolved',
            rejected: 'Rejected'
        };
        this.currentState = this.states.waiting;
        this.result = null;
        this.error = null;
        this.handlers = [];
        this.resolve = this.resolve.bind(this);
        this.reject = this.reject.bind(this);

        try {
            initializer(this.resolve, this.reject);
        } catch (err) {
            this.reject(err);
        }
    }

    resolve(result) {
        if (result instanceof DSPromise) {
            result.then(
                (result) => {
                    this.resolve(result);
                },
                (error) => {
                    this.reject(error);
                }
            );
            return;
        }
        this.result = result;
        this.currentState = this.states.resolved;
        this.runHandlers();
    }

    reject(error) {
        this.error = error;
        this.currentState = this.states.rejected;
        this.runHandlers();
    }

    then(resolve, reject) {
        if (!resolve) {
            resolve = (result) => result;
        }
        if (!reject) {
            reject = (err) => {
                throw new Error(err);
            };
        }

        return new DSPromise((promiseResolve, promiseReject) => {
            const handler = ({currentState, result, error}) => {
                try {
                    let promiseResult;
                    switch (currentState) {
                        case this.states.resolved:
                            promiseResult = resolve(result);
                            break;
                        case this.states.rejected:
                            promiseResult = reject(error);
                            break;
                        default:
                            break;
                    }
                    promiseResolve(promiseResult);
                } catch (error) {
                    promiseReject(error)
                }

            };

            if ([this.states.resolved, this.states.rejected].includes(this.currentState)) {
                handler({
                    currentState: this.currentState,
                    result: this.result,
                    error: this.error
                })
            } else {
                this.handlers.push(handler);
            }
        });
    }

    runHandlers() {
        for (let handler of this.handlers) {
            handler({
                currentState: this.currentState,
                result: this.result,
                error: this.error
            });
        }
    }
}
