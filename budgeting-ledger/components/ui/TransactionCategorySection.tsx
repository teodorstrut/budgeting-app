import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../app/ThemeProvider';
import { Category } from '../../database/repositories/categoryRepository';
import { transactionService } from '../../services/transactionService';

interface TransactionCategorySectionProps {
    categories: Category[];
    transactionType: 'income' | 'expense';
    selectedCategoryId: number | null;
    onSelectCategory: (id: number | null) => void;
}

export const TransactionCategorySection: React.FC<TransactionCategorySectionProps> = ({
    categories,
    transactionType,
    selectedCategoryId,
    onSelectCategory,
}) => {
    const { theme } = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);

    const sortedCategories = useMemo(() => {
        const usageByCategoryId = new Map<number, number>();

        transactionService.getTransactions().forEach((transaction) => {
            if (transaction.categoryId != null) {
                usageByCategoryId.set(
                    transaction.categoryId,
                    (usageByCategoryId.get(transaction.categoryId) ?? 0) + 1
                );
            }
        });

        return categories
            .filter((cat) => cat.type === transactionType)
            .sort((a, b) => {
                const aCount = a.id != null ? usageByCategoryId.get(a.id) ?? 0 : 0;
                const bCount = b.id != null ? usageByCategoryId.get(b.id) ?? 0 : 0;

                if (bCount !== aCount) {
                    return bCount - aCount;
                }

                return a.name.localeCompare(b.name);
            });
    }, [categories, transactionType]);

    const categoriesPerRow = 3;
    const visibleRows = 3;
    const collapsedLimit = categoriesPerRow * visibleRows;
    const hasMoreThanThreeRows = sortedCategories.length > collapsedLimit;
    const visibleCategories = isExpanded ? sortedCategories : sortedCategories.slice(0, collapsedLimit);

    return (
        <>
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Category</Text>

            <View style={styles.categoryContainer}>
                {sortedCategories.length === 0 ? (
                    <Text style={[styles.hintText, { color: theme.colors.onSurfaceVariant }]}>No categories yet</Text>
                ) : (
                    visibleCategories.map((cat, idx) => (
                        <TouchableOpacity
                            key={cat.id != null ? cat.id.toString() : `${cat.name}-${idx}`}
                            style={[
                                styles.categoryChip,
                                {
                                    backgroundColor:
                                        selectedCategoryId === cat.id ? transactionType === 'expense' ? theme.colors.secondary : theme.colors.primary : theme.colors.surfaceContainerLow,
                                    borderColor: selectedCategoryId === cat.id ? theme.colors.secondary : theme.colors.outline,
                                },
                            ]}
                            onPress={() => {
                                onSelectCategory(cat.id ?? null);
                            }}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    {
                                        color:
                                            selectedCategoryId === cat.id ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                                    },
                                ]}
                            >
                                {cat.emoji ? `${cat.emoji} ` : ''}
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))
                )}
            </View>

            {hasMoreThanThreeRows && (
                <TouchableOpacity
                    style={[styles.showMoreButton, { borderColor: theme.colors.outlineVariant }]}
                    onPress={() => setIsExpanded((prev) => !prev)}
                >
                    <Text style={[styles.showMoreText, { color: theme.colors.primary }]}>
                        {isExpanded ? 'Show less' : 'Show more'}
                    </Text>
                </TouchableOpacity>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    categoryContainer: {
        marginTop: 8,
        marginBottom: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    hintText: {
        fontSize: 14,
        textAlign: 'center',
    },
    showMoreButton: {
        marginTop: 4,
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 8,
        alignItems: 'center',
    },
    showMoreText: {
        fontSize: 13,
        fontWeight: '700',
    },
});
