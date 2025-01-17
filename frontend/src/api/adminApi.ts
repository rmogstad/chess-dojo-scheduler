import axios, { AxiosResponse } from 'axios';

import { User } from '../database/user';
import { getConfig } from '../config';
import { Requirement } from '../database/requirement';

const BASE_URL = getConfig().api.baseUrl;

/**
 * AdminApiContextType provides an API for interacting with the admin functions.
 */
export type AdminApiContextType = {
    /**
     * adminListUsers returns all users in the database.
     * @returns A list of users.
     */
    adminListUsers: (startKey?: string) => Promise<User[]>;

    /**
     * adminGetStatistics returns an AxiosResponse containing the GetStatisticsResponse object.
     */
    adminGetStatistics: () => Promise<AxiosResponse<GetStatisticsResponse, any>>;

    /**
     * adminListRequirements returns all requirements in the database.
     * @param startKey The optional start key to use when searching.
     * @returns A list of requirements.
     */
    adminListRequirements: (startKey?: string) => Promise<Requirement[]>;
};

interface ListUsersResponse {
    users: User[];
    lastEvaluatedKey: string;
}

/**
 * Returns a list of all users in the database.
 * @param idToken The id token of the current signed-in user.
 * @param startKey The first startKey to use when searching.
 * @returns A list of all users in the database.
 */
export async function adminListUsers(idToken: string, startKey?: string) {
    let params = { startKey };
    const result: User[] = [];

    do {
        const resp = await axios.get<ListUsersResponse>(BASE_URL + '/admin/user', {
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

export interface GetStatisticsResponse {}

/**
 * adminGetStatistics returns an AxiosResponse containing the GetStatisticsResponse object.
 * @param idToken The id token of the current signed-in user.
 */
export function adminGetStatistics(idToken: string) {
    return axios.get<GetStatisticsResponse>(BASE_URL + '/admin/statistics', {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

interface ListRequirementsResponse {
    requirements: Requirement[];
    lastEvaluatedKey: string;
}

export async function adminListRequirements(idToken: string, startKey?: string) {
    let params = { startKey };
    const result: Requirement[] = [];

    do {
        const resp = await axios.get<ListRequirementsResponse>(
            BASE_URL + '/admin/requirement',
            {
                params,
                headers: {
                    Authorization: 'Bearer ' + idToken,
                },
            }
        );

        result.push(...resp.data.requirements);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}
