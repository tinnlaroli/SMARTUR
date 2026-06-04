import React, { useMemo } from 'react';
import { AnimatedTestimonials, type Testimonial } from '@/components/ui/animated-testimonials';
import { useLanguage } from '../../../contexts/LanguageContext';

const TESTIMONIAL_SOURCE = [
    {
        id: 1,
        nameKey: 'testimonials.item1.name',
        roleKey: 'testimonials.item1.role',
        textKey: 'testimonials.item1.content',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=face',
    },
    {
        id: 2,
        nameKey: 'testimonials.item2.name',
        roleKey: 'testimonials.item2.role',
        textKey: 'testimonials.item2.content',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face',
    },
    {
        id: 3,
        nameKey: 'testimonials.item3.name',
        roleKey: 'testimonials.item3.role',
        textKey: 'testimonials.item3.content',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&crop=face',
    },
] as const;

function parseRoleAndCompany(roleLine: string): { role: string; company: string } {
    const comma = roleLine.indexOf(',');
    if (comma === -1) return { role: roleLine, company: 'Veracruz' };
    return {
        role: roleLine.slice(0, comma).trim(),
        company: roleLine.slice(comma + 1).trim(),
    };
}

export const Testimonials: React.FC = () => {
    const { t } = useLanguage();

    const testimonials = useMemo<Testimonial[]>(
        () =>
            TESTIMONIAL_SOURCE.map((item) => {
                const { role, company } = parseRoleAndCompany(t(item.roleKey));
                return {
                    id: item.id,
                    name: t(item.nameKey),
                    role,
                    company,
                    content: t(item.textKey),
                    rating: 5,
                    avatar: item.avatar,
                };
            }),
        [t],
    );

    return (
        <AnimatedTestimonials
            sectionId="testimonios"
            sectionLabel={t('testimonials.label')}
            title={t('testimonials.title')}
            subtitle={t('testimonials.subtitle')}
            testimonials={testimonials}
            autoRotateInterval={6000}
        />
    );
};
