import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { LayoutDashboard, Dumbbell, Calendar, TrendingUp, Activity, User } from 'lucide-react-native';
import { View } from 'react-native';

import DashboardScreen from '../screens/DashboardScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import LiveWorkoutScreen from '../screens/LiveWorkoutScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AppointmentsScreen from '../screens/AppointmentsScreen';
import ProgressScreen from '../screens/ProgressScreen';
import BodyCompositionScreen from '../screens/BodyCompositionScreen';
import ProfileScreen from '../screens/ProfileScreen';

const WorkoutsStack = createNativeStackNavigator();

function WorkoutsStackNavigator() {
    return (
        <WorkoutsStack.Navigator screenOptions={{ headerShown: false }}>
            <WorkoutsStack.Screen name="WorkoutsList" component={WorkoutsScreen} />
            <WorkoutsStack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
            <WorkoutsStack.Screen name="LiveWorkout" component={LiveWorkoutScreen} />
        </WorkoutsStack.Navigator>
    );
}

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderTopColor: 'rgba(255, 255, 255, 0.1)',
                    borderTopWidth: 1,
                    height: 85,
                    paddingBottom: 25,
                    paddingTop: 8,
                    position: 'absolute',
                    elevation: 0,
                },
                tabBarActiveTintColor: '#34d399',
                tabBarInactiveTintColor: '#64748b',
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Accueil',
                    tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size - 2} />,
                }}
            />
            <Tab.Screen
                name="Workouts"
                component={WorkoutsStackNavigator}
                options={({ route }) => {
                    const routeName = getFocusedRouteNameFromRoute(route) ?? 'WorkoutsList';
                    const isFullscreen = routeName === 'LiveWorkout';
                    return {
                        tabBarLabel: 'Programme',
                        tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size - 2} />,
                        tabBarStyle: isFullscreen ? { display: 'none' } : {
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            borderTopColor: 'rgba(255, 255, 255, 0.1)',
                            borderTopWidth: 1,
                            height: 85,
                            paddingBottom: 25,
                            paddingTop: 8,
                            position: 'absolute',
                            elevation: 0,
                        }
                    };
                }}
            />
            <Tab.Screen
                name="Appointments"
                component={AppointmentsScreen}
                options={{
                    tabBarLabel: 'Agenda',
                    tabBarIcon: ({ color, size }) => <Calendar color={color} size={size - 2} />,
                }}
            />
            <Tab.Screen
                name="Progress"
                component={ProgressScreen}
                options={{
                    tabBarLabel: 'Progrès',
                    tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size - 2} />,
                }}
            />
            <Tab.Screen
                name="BodyComposition"
                component={BodyCompositionScreen}
                options={{
                    tabBarLabel: 'Biométrie',
                    tabBarIcon: ({ color, size }) => <Activity color={color} size={size - 2} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profil',
                    tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} />,
                }}
            />
        </Tab.Navigator>
    );
}
