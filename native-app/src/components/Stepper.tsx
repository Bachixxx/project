import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, Animated } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

interface StepperProps {
    value: number;
    onChange: (newValue: number) => void;
    label?: string;
    unit?: string;
    ghostValue?: number;
    step?: number;
    min?: number;
    max?: number;
}

export const Stepper = ({
    value,
    onChange,
    label,
    unit,
    ghostValue,
    step = 1,
    min = 0,
    max = 999
}: StepperProps) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = (type: 'inc' | 'dec') => {
        // Feedback Tactile (Basic Vibration fallback)
        Vibration.vibrate(10);

        // Animation de pression
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 50, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();

        const newValue = type === 'inc' ? value + step : value - step;
        if (newValue >= min && newValue <= max) {
            onChange(Number(newValue.toFixed(2))); // Éviter les erreurs de flottants
        }
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <Animated.View style={[styles.inner, { transform: [{ scale: scaleAnim }] }]}>
                <TouchableOpacity
                    onPress={() => handlePress('dec')}
                    style={styles.button}
                    activeOpacity={0.7}
                >
                    <Minus size={20} color="#94a3b8" strokeWidth={3} />
                </TouchableOpacity>

                <View style={styles.valueContainer}>
                    <View style={{ alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={styles.valueText}>{value}</Text>
                            {unit && <Text style={styles.unitText}>{unit}</Text>}
                        </View>
                        {ghostValue !== undefined && (
                            <Text style={styles.ghostText}>L: {ghostValue}{unit}</Text>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => handlePress('inc')}
                    style={styles.button}
                    activeOpacity={0.7}
                >
                    <Plus size={20} color="#3b82f6" strokeWidth={3} />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minWidth: '45%',
    },
    label: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        textAlign: 'center',
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#27272a',
        borderRadius: 20,
        height: 64,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    button: {
        width: 52,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
    },
    valueContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    valueText: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    unitText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 2,
    },
    ghostText: {
        color: 'rgba(255, 255, 255, 0.2)',
        fontSize: 10,
        fontWeight: '700',
        marginTop: -4,
    },
});
