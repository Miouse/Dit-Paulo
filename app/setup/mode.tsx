// app/setup/mode.tsx
// Redirection automatique vers le nouveau sélecteur de catégories

import { Redirect } from 'expo-router';
import React from 'react';

export default function ModeScreen() {
  return <Redirect href="/setup/categories" />;
}
