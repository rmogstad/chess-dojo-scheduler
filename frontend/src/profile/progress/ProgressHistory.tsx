import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Button,
    DialogActions,
    DialogContent,
    DialogContentText,
    Divider,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LoadingButton } from '@mui/lab';

import { Requirement, TimelineEntry } from '../../database/requirement';
import { useAuth } from '../../auth/Auth';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useApi } from '../../api/Api';

const NUMBER_REGEX = /^[0-9]*$/;

interface HistoryItem {
    date: Date | null;
    count: string;
    hours: string;
    minutes: string;
    entry: TimelineEntry;
    index: number;
}

type ProgressHistoryItemProps = HistoryItem & {
    error: HistoryItemError;
    updateItem: (item: HistoryItem) => void;
    deleteItem: () => void;
};

const ProgressHistoryItem: React.FC<ProgressHistoryItemProps> = ({
    date,
    count,
    hours,
    minutes,
    entry,
    index,
    error,
    updateItem,
    deleteItem,
}) => {
    const onChangeDate = (value: Date | null) => {
        updateItem({
            date: value,
            count,
            hours,
            minutes,
            entry,
            index,
        });
    };

    const onChangeCount = (value: string) => {
        updateItem({
            date,
            count: value,
            hours,
            minutes,
            entry,
            index,
        });
    };

    const onChangeHours = (value: string) => {
        updateItem({
            date,
            count,
            hours: value,
            minutes,
            entry,
            index,
        });
    };

    const onChangeMinutes = (value: string) => {
        updateItem({
            date,
            count,
            hours,
            minutes: value,
            entry,
            index,
        });
    };

    return (
        <>
            <Stack
                direction='row'
                spacing={{ xs: 0, sm: 1 }}
                width={1}
                alignItems='center'
                flexWrap={{ xs: 'wrap', sm: 'nowrap' }}
                rowGap={2}
            >
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label='Date'
                        value={date}
                        onChange={onChangeDate}
                        slotProps={{
                            textField: {
                                error: !!error.date,
                                helperText: error.date,
                            },
                        }}
                    />
                </LocalizationProvider>

                <TextField
                    label='Count'
                    value={count}
                    onChange={(event) => onChangeCount(event.target.value)}
                    sx={{ maxWidth: '100px' }}
                    error={!!error.count}
                    helperText={error.count}
                />

                <TextField
                    label='Hours'
                    value={hours}
                    inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                    }}
                    onChange={(event) => onChangeHours(event.target.value)}
                    sx={{ maxWidth: '100px' }}
                    error={!!error.hours}
                    helperText={error.hours}
                />

                <TextField
                    label='Minutes'
                    value={minutes}
                    inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                    }}
                    onChange={(event) => onChangeMinutes(event.target.value)}
                    sx={{ maxWidth: '100px' }}
                    error={!!error.minutes}
                    helperText={error.minutes}
                />

                <IconButton aria-label='delete' onClick={deleteItem}>
                    <DeleteIcon />
                </IconButton>
            </Stack>
            <Divider sx={{ display: { xs: 'inherit', sm: 'none' } }} />
        </>
    );
};

interface HistoryItemError {
    date?: string;
    count?: string;
    hours?: string;
    minutes?: string;
}

function getTimelineUpdate(
    items: HistoryItem[],
    cohort: string
): {
    timeline: TimelineEntry[];
    errors: Record<number, HistoryItemError>;
} {
    const errors: Record<number, HistoryItemError> = {};

    items.forEach((item, idx) => {
        let itemErrors: HistoryItemError = {};
        if (item.date === null) {
            itemErrors.date = 'This field is required';
        }
        if (isNaN(parseInt(item.count)) || parseInt(item.count) === 0) {
            itemErrors.count = 'This field must be a non-zero integer';
        }
        if (
            item.hours !== '' &&
            (!NUMBER_REGEX.test(item.hours) || isNaN(parseInt(item.hours)))
        ) {
            itemErrors.hours = 'This field must be an integer';
        }
        if (
            item.minutes !== '' &&
            (!NUMBER_REGEX.test(item.minutes) || isNaN(parseInt(item.minutes)))
        ) {
            itemErrors.minutes = 'This field must be an integer';
        }
        if (Object.values(itemErrors).length > 0) {
            errors[idx] = itemErrors;
        }
    });

    if (Object.values(errors).length > 0) {
        return {
            timeline: [],
            errors,
        };
    }

    const timeline: TimelineEntry[] = items.map((item, idx) => {
        const previousCount = idx === 0 ? 0 : items[idx - 1].entry.newCount;
        const newCount = previousCount + parseInt(item.count);
        const minutesSpent =
            60 * parseInt(item.hours || '0') + parseInt(item.minutes || '0');

        return {
            ...item.entry,
            previousCount,
            newCount,
            minutesSpent,
        };
    });

    return {
        timeline,
        errors,
    };
}

interface ProgressHistoryProps {
    requirement: Requirement;
    cohort: string;
    onClose: () => void;
    toggleView?: () => void;
}

const ProgressHistory: React.FC<ProgressHistoryProps> = ({
    requirement,
    cohort,
    onClose,
    toggleView,
}) => {
    const user = useAuth().user!;
    const api = useApi();
    const request = useRequest();

    const [errors, setErrors] = useState<Record<number, HistoryItemError>>({});

    const initialItems: HistoryItem[] = useMemo(() => {
        return user.timeline
            .filter((t) => t.requirementId === requirement.id && t.cohort === cohort)
            .map((t, idx) => ({
                date: new Date(t.createdAt),
                count: `${t.newCount - t.previousCount}`,
                hours: `${Math.floor(t.minutesSpent / 60)}`,
                minutes: `${t.minutesSpent % 60}`,
                cohort: t.cohort,
                entry: t,
                index: idx,
            }));
    }, [requirement, user, cohort]);

    const [items, setItems] = useState(initialItems);

    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    const totalCount = useMemo(() => {
        return items.reduce((sum, item) => {
            if (isNaN(parseInt(item.count))) {
                return sum;
            }
            return sum + parseInt(item.count);
        }, 0);
    }, [items]);

    const totalTime = useMemo(() => {
        return items.reduce((sum, item) => {
            let newSum = sum;
            if (NUMBER_REGEX.test(item.hours) && !isNaN(parseInt(item.hours))) {
                newSum += 60 * parseInt(item.hours);
            }

            if (NUMBER_REGEX.test(item.minutes) && !isNaN(parseInt(item.minutes))) {
                newSum += parseInt(item.minutes);
            }
            return newSum;
        }, 0);
    }, [items]);

    const getUpdateItem = useCallback(
        (idx: number) => (item: HistoryItem) =>
            setItems((items) => [...items.slice(0, idx), item, ...items.slice(idx + 1)]),
        [setItems]
    );

    const getDeleteItem = useCallback(
        (idx: number) => () =>
            setItems((items) => [...items.slice(0, idx), ...items.slice(idx + 1)]),
        [setItems]
    );

    const onSubmit = () => {
        const update = getTimelineUpdate(items, cohort);

        setErrors(update.errors);
        if (Object.values(update.errors).length > 0) {
            return;
        }

        request.onStart();

        api.updateUserTimeline(
            requirement.id,
            cohort,
            update.timeline,
            totalCount,
            totalTime
        )
            .then((response) => {
                console.log('updateUserTimeline: ', response);
                onClose();
                request.onSuccess(response);
            })
            .catch((err) => {
                console.error('updateUserTimeline: ', err);
                request.onFailure(err);
            });
    };

    return (
        <>
            <DialogContent>
                {items.length === 0 ? (
                    <DialogContentText>
                        You have no history for this requirement in cohort {cohort}.
                        Please choose a different cohort to edit your history.
                    </DialogContentText>
                ) : (
                    <Stack spacing={3} mt={1} width={1}>
                        {items.map((item, idx) => (
                            <ProgressHistoryItem
                                key={idx}
                                {...item}
                                error={errors[idx] || {}}
                                updateItem={getUpdateItem(idx)}
                                deleteItem={getDeleteItem(idx)}
                            />
                        ))}

                        <Stack>
                            <Typography color='text.secondary'>
                                Total Count: {totalCount}
                            </Typography>
                            <Typography color='text.secondary'>
                                Total Time:{' '}
                                {`${Math.floor(totalTime / 60)}h ${totalTime % 60}m`}
                            </Typography>
                        </Stack>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={request.isLoading()}>
                    Cancel
                </Button>
                {toggleView && (
                    <Button onClick={toggleView} disabled={request.isLoading()}>
                        Hide History
                    </Button>
                )}
                <LoadingButton loading={request.isLoading()} onClick={onSubmit}>
                    Save
                </LoadingButton>
            </DialogActions>
            <RequestSnackbar request={request} />
        </>
    );
};

export default ProgressHistory;
