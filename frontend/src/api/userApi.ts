import axios, { AxiosResponse } from 'axios';

import { User } from '../database/user';
import { getConfig } from '../config';
import { Graduation } from '../database/graduation';
import { TimelineEntry } from '../database/requirement';
import { UserStatistics } from '../database/statistics';

const BASE_URL = getConfig().api.baseUrl;

/**
 * UserApiContextType provides an API for interacting with the current signed-in user.
 */
export type UserApiContextType = {
    /**
     * getUser returns the current signed-in user.
     * @returns An AxiosResponse containing the current user in the data field.
     */
    getUser: () => Promise<AxiosResponse<User, any>>;

    /**
     * getUserPublic returns the user with the provided username.
     * @returns An AxiosResponse containing the provided user in the data field.
     */
    getUserPublic: (username: string) => Promise<AxiosResponse<User, any>>;

    /**
     * listUsersByCohort returns a list of users in the provided cohort.
     * @param cohort The cohort to get users in.
     * @param startKey The optional start key to use when searching.
     * @returns A list of users in the provided cohort.
     */
    listUsersByCohort: (cohort: string, startKey?: string) => Promise<User[]>;

    /**
     * updateUser applies the given updates to the current signed-in user.
     * @param update The updates to apply.
     * @returns An AxiosResponse containing the updated user in the data field.
     */
    updateUser: (update: Partial<User>) => Promise<AxiosResponse<User, any>>;

    /**
     * updateUserProgress updates the current user's progress on the provided requirement.
     * @param cohort The cohort the user is making progress in.
     * @param requirementId The id of the requirement to update.
     * @param incrementalCount The amount by which the user is increasing their count.
     * @param incrementalMinutesSpent The amount by which the user is increasing their time spent.
     * @returns An AxiosResponse containing the updated user in the data field.
     */
    updateUserProgress: (
        cohort: string,
        requirementId: string,
        incrementalCount: number,
        incrementalMinutesSpent: number
    ) => Promise<AxiosResponse<User, any>>;

    /**
     * updateUserTimeline sets the current user's timeline for the provided requirement.
     * @param requirementId The id of the requirement being updated.
     * @param cohort The cohort to update the timeline for.
     * @param entries The timeline entries to set on the requirement.
     * @param count The cohort count to set on the requirement.
     * @param minutesSpent The cohort minutes spent to set on the requirement.
     * @returns An AxiosResponse containing the updated user in the data field.
     */
    updateUserTimeline: (
        requirementId: string,
        cohort: string,
        entries: TimelineEntry[],
        count: number,
        minutesSpent: number
    ) => Promise<AxiosResponse<User, any>>;

    /**
     * graduate creates a new graduation object for the given user and updates them to the next cohort.
     * @param comments The comments the user wants to add to their graduation object.
     * @returns An AxiosResponse containing the new graduation object and the user update.
     */
    graduate: (comments: string) => Promise<AxiosResponse<GraduationResponse, any>>;

    /**
     * @returns An AxiosResponse containing the user statistics.
     */
    getUserStatistics: () => Promise<AxiosResponse<UserStatistics, any>>;
};

/**
 * getUser returns the current signed-in user.
 * @param idToken The id token of the current signed-in user.
 * @returns An AxiosResponse containing the current user in the data field.
 */
export function getUser(idToken: string) {
    return axios.get<User>(BASE_URL + '/user', {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

/**
 * getUserPublic returns the public information for the provided username.
 * @param username The user to fetch public information for.
 * @returns An AxiosResponse containing the requested user.
 */
export function getUserPublic(username: string) {
    return axios.get<User>(BASE_URL + '/public/user/' + username);
}

interface ListUsersResponse {
    users: User[];
    lastEvaluatedKey: string;
}

/**
 * listUsersByCohort returns a list of users in the provided cohort.
 * @param idToken The id token of the current signed-in user.
 * @param cohort The cohort to search for users.
 * @param startKey The optional startKey to use when searching.
 * @returns A list of users in the provided cohort.
 */
export async function listUsersByCohort(
    idToken: string,
    cohort: string,
    startKey?: string
) {
    let params = { startKey };
    const result: User[] = [];
    do {
        const resp = await axios.get<ListUsersResponse>(BASE_URL + `/user/${cohort}`, {
            params,
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        });
        result.push(...resp.data.users);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);
    return result;
}

/**
 * updateUser applies the given updates to the current signed-in user.
 * @param idToken The id token of the current signed-in user.
 * @param update The updates to apply.
 * @param callback A callback function to invoke with the update after it has succeeded on the backend.
 * @returns An AxiosResponse containing the updated user in the data field.
 */
export async function updateUser(
    idToken: string,
    update: Partial<User>,
    callback: (update: Partial<User>) => void
) {
    const result = await axios.put<User>(BASE_URL + '/user', update, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
    callback(result.data);
    return result;
}

/**
 * updateUserProgress updates the current user's progress on the provided requirement.
 * @param idToken The id token of the current signed-in user.
 * @param cohort The cohort the user is making progress in.
 * @param requirementId The id of the requirement to update.
 * @param incrementalCount The amount by which the user is increasing their count.
 * @param incrementalMinutesSpent The amount by which the user is increasing their time spent.
 * @param callback A callback function to invoke with the update after it has succeeded on the backend.
 * @returns An AxiosResponse containing the updated user in the data field.
 */
export async function updateUserProgress(
    idToken: string,
    cohort: string,
    requirementId: string,
    incrementalCount: number,
    incrementalMinutesSpent: number,
    callback: (update: Partial<User>) => void
) {
    const result = await axios.post<User>(
        BASE_URL + '/user/progress',
        {
            cohort,
            requirementId,
            incrementalCount,
            incrementalMinutesSpent,
        },
        {
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        }
    );
    callback(result.data);
    return result;
}

/**
 * updateUserTimeline sets the current user's timeline for the provided requirement.
 * @param idToken The id token of the current signed-in user.
 * @param requirementId The id of the requirement being updated.
 * @param cohort The cohort to set the requirement for.
 * @param entries The timeline entries to set on the requirement.
 * @param count The cohort count to set on the requirement.
 * @param minutesSpent The cohort minutes spent to set on the requirement.
 * @param callback A callback function to invoke with the update after it has succeeded on the backend.
 * @returns An AxiosResponse containing the updated user in the data field.
 */
export async function updateUserTimeline(
    idToken: string,
    requirementId: string,
    cohort: string,
    entries: TimelineEntry[],
    count: number,
    minutesSpent: number,
    callback: (update: Partial<User>) => void
) {
    const result = await axios.post<User>(
        BASE_URL + '/user/progress/timeline',
        {
            requirementId,
            cohort,
            entries,
            count,
            minutesSpent,
        },
        {
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        }
    );
    callback(result.data);
    return result;
}

interface GraduationResponse {
    graduation: Graduation;
    userUpdate: Partial<User>;
}

/**
 * graduate creates a new graduation object for the current user. If successful,
 * the current user is updated to match the effects of the graduation.
 * @param idToken The id token of the current signed-in user.
 * @param comments The comments the user wants to add to their graduation.
 * @param callback A callback function to invoke with the user update upon success.
 * @returns An AxiosResponse containing the new graduation object and the user update.
 */
export async function graduate(
    idToken: string,
    comments: string,
    callback: (update: Partial<User>) => void
) {
    const result = await axios.post<GraduationResponse>(
        BASE_URL + '/user/graduate',
        { comments },
        {
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        }
    );
    callback(result.data.userUpdate);
    return result;
}

/**
 * @returns An AxiosResponse containing the user statistics.
 */
export function getUserStatistics() {
    return axios.get<UserStatistics>(BASE_URL + '/public/user/statistics');
}
