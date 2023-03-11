import { RequirementProgress } from './requirement';
import { RatingSystem } from './user';

export interface Graduation {
    username: string;
    discordUsername: string;
    previousCohort: string;
    newCohort: string;
    score: number;
    ratingSystem: RatingSystem;
    startRating: number;
    currentRating: number;
    comments: string;
    progress: {
        [id: string]: RequirementProgress;
    };
    startedAt: string;
    updatedAt: string;
}