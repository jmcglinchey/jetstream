import { ENV } from '../env';
import { getOrgs, updateOrg, deleteOrg, getUserInfo } from '../storage';
import { ControllerFn, ControllerFnDataParams, ControllerFnParams } from '../types';

export const placeholder: ControllerFn = async (_, __, params, { reject, resolve, connection, request }) => {
  reject(new Error('Not yet implemented'));
  return;
};

export const heartbeat: ControllerFn = async (_, __, params, { reject, resolve, connection, request }) => {
  try {
    // TODO: add custom webpack config to get version info
    resolve({ version: ENV.GIT_VERSION || null });
  } catch (ex) {
    reject(ex);
  }
};

export const getUserProfile: ControllerFn = async (_, __, params, { reject, resolve, connection, request }) => {
  try {
    // const user = {
    //   sub: 'google-oauth2|116087078021369259894',
    //   given_name: 'Austin',
    //   family_name: 'Turner',
    //   nickname: 'paustint',
    //   name: 'Austin Turner',
    //   picture: 'https://lh3.googleusercontent.com/a-/AOh14Ggm4uEKRl9ost7d6zV5JfK0xKo25_TZf2cuKdOTR1s=s96-c',
    //   locale: 'en',
    //   updated_at: '2022-04-30T14:24:26.493Z',
    //   email: 'paustint@gmail.com',
    //   email_verified: true,
    //   'http://getjetstream.app/app_metadata': {
    //     featureFlags: {
    //       flagVersion: 'V1.4',
    //       flags: ['all'],
    //       isDefault: false,
    //     },
    //     lastActivity: '2022-04-27',
    //   },
    // };
    resolve(getUserInfo());
  } catch (ex) {
    reject(ex);
  }
};

export const handleGetOrgs: ControllerFn = async (_, __, params, { reject, resolve, connection, request }) => {
  try {
    const orgs = await getOrgs();
    resolve(orgs);
  } catch (ex) {
    reject(ex);
  }
};

export const handleUpdateOrg: ControllerFnDataParams<{ label: string; color: string }, { uniqueId: string }> = async (
  _,
  __,
  params,
  { reject, resolve, connection, request }
) => {
  try {
    const data = { label: request.data.label, color: request.data.color };
    const orgs = await updateOrg(params.uniqueId, data);
    resolve(orgs);
  } catch (ex) {
    reject(ex);
  }
};

export const handleDeleteOrg: ControllerFnParams<{ uniqueId: string }> = async (
  _,
  __,
  params,
  { reject, resolve, connection, request }
) => {
  try {
    const orgs = await deleteOrg(params.uniqueId);
    resolve(orgs);
  } catch (ex) {
    reject(ex);
  }
};