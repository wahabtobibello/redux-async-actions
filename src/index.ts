import identity from 'lodash/identity';
import { Action, ActionMeta, createAction } from 'redux-actions';
import { ActionCreator } from 'redux';
import { call, Effect } from 'redux-saga/effects';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';

interface AsyncMeta<T> {
  resolve: (result: T) => void;
  reject: (error: Error) => void;
}

export type Actions<Payload = any> = ActionMeta<Payload, AsyncMeta<any>>;

export type ThunkResult<Result, State> = ThunkAction<
  Result,
  State,
  undefined,
  Actions
>;

type AsyncActionCreator<State> = {
  (...args: any[]): ThunkResult<Promise<any>, State>;
};

export const createAsyncAction = <State>(
  actionType: string,
  payloadCreator = identity
): AsyncActionCreator<State> => {
  const metaCreator = (...args: any[]): AsyncMeta<any> => {
    const [resolve, reject] = args.slice(-2);
    return {
      resolve,
      reject
    } as AsyncMeta<any>;
  };
  const actionCreator = (...args: any[]) => (
    dispatch: ThunkDispatch<State, undefined, Actions>
  ) =>
    new Promise((resolve, reject) => {
      dispatch(
        createAction<any, AsyncMeta<any>>(
          actionType,
          payloadCreator,
          metaCreator
        )(...args, resolve, reject)
      );
    });
  actionCreator[Symbol.toPrimitive] = () => actionType;
  actionCreator.toString = () => actionType;
  return actionCreator;
};

export const createAsyncActions = <State, Payload = any>(
  actionType: string,
  ...args: any[]
): [
  AsyncActionCreator<State>,
  ActionCreator<Action<Payload>>,
  ActionCreator<Action<any>>
] => {
  const requestAction = createAsyncAction(`${actionType}_REQUEST`, ...args);
  const successAction = createAction(`${actionType}_SUCCESS`);
  const failureAction = createAction(`${actionType}_FAILURE`);
  return [requestAction, successAction, failureAction];
};

export const createAsyncSaga = (
  originalSaga: (action: Actions) => Generator<Effect>
) =>
  function* newSaga(action: Actions): Generator<Effect, any, any> {
    const { meta } = action;
    try {
      const result = yield call<(action: Actions) => Generator<Effect>>(
        originalSaga,
        action
      );
      if (meta?.resolve) {
        yield call<(result: any) => void>(meta.resolve, result);
      }
    } catch (error) {
      if (meta?.reject) {
        yield call<(error: Error) => void>(meta.reject, error);
      }
    }
  };

export * from './reducer';
