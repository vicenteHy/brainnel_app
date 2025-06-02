import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface IconComponentProps {
  name: string;
  size: number;
  color: string;
}

const IconComponent: React.FC<IconComponentProps> = ({ name, size, color }) => {
  return <Ionicons name={name as any} size={size} color={color} />;
};

export default IconComponent; 