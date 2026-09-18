// app/setup/intensity.tsx
// Redirection obsolète vers setup/categories

import { Redirect } from 'expo-router';
import React from 'react';

export default function IntensityScreen() {
  return <Redirect href="/setup/categories" />;
}
