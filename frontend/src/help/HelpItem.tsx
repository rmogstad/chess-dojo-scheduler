import { Stack, Typography } from '@mui/material';
import { PropsWithChildren } from 'react';

interface HelpItemProps {
    title: string;
}

const HelpItem: React.FC<PropsWithChildren<HelpItemProps>> = ({ title, children }) => {
    return (
        <Stack spacing={0.5}>
            <Typography variant='h6'>{title}</Typography>
            <Typography variant='body1'>{children}</Typography>
        </Stack>
    );
};

export default HelpItem;
