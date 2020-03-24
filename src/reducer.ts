import { combineReducers } from 'redux';
import { Action } from 'redux-actions';
import _ from 'lodash';

export const loadingReducer = (state = {}, action: Action<{}>) => {
  const { type } = action;
  const matches = /(.*)_(REQUEST|SUCCESS|FAILURE)/.exec(type);
  if (!matches) return state;

  const [, requestName, requestState] = matches;
  return {
    ...state,
    [requestName]: requestState === 'REQUEST'
  };
};

export const errorReducer = (state = {}, action: Action<{}>) => {
  const { type, error } = action;
  const matches = /(.*)_(REQUEST|FAILURE)/.exec(type);

  if (!matches) return state;

  const [, requestName, requestState] = matches;
  return {
    ...state,
    [requestName]: requestState === 'FAILURE' ? error : null
  };
};

export const createLoadingSelector = (requestNames: string[]) => (state: any) =>
  _(requestNames)
    .castArray()
    .some(type =>
      _.get(
        state,
        `async.loading.${type.replace(/_(REQUEST|SUCCESS|FAILURE)/, '')}`
      )
    );

export const createErrorSelector = (requestNames: string[]) => (state: any) =>
  _(requestNames)
    .castArray()
    .map(type =>
      _.get(
        state,
        `async.errors.${type.replace(/_(REQUEST|SUCCESS|FAILURE)/, '')}`
      )
    )
    .compact()
    .first() || null;

export const createAsyncSelector = (requestNames: string[]) => {
  const getLoading = createLoadingSelector(requestNames);
  const getError = createErrorSelector(requestNames);

  return (state: any) => ({
    loading: getLoading(state),
    error: getError(state)
  });
};

export const asyncReducer = combineReducers({
  loading: loadingReducer,
  errors: errorReducer
});
