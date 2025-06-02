import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

const IconComponent = React.memo(
  ({ name, size, color }: { name: string; size: number; color: string }) => {
    const Icon = Ionicons as any;
    return <Icon name={name} size={size} color={color} />;
  }
);

export default IconComponent;