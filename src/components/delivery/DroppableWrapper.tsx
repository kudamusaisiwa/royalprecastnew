import React from 'react';
import { Droppable, DroppableProps } from 'react-beautiful-dnd';

// Create a wrapper component that uses default parameters instead of defaultProps
const DroppableWrapper = ({ 
  children, 
  droppableId, 
  type = 'DEFAULT',
  mode = 'standard',
  isDropDisabled = false,
  isCombineEnabled = false,
  direction = 'vertical',
  ignoreContainerClipping = false,
  renderClone,
  getContainerForClone
}: DroppableProps) => {
  return (
    <Droppable
      droppableId={droppableId}
      type={type}
      mode={mode}
      isDropDisabled={isDropDisabled}
      isCombineEnabled={isCombineEnabled}
      direction={direction}
      ignoreContainerClipping={ignoreContainerClipping}
      renderClone={renderClone}
      getContainerForClone={getContainerForClone}
    >
      {children}
    </Droppable>
  );
};

export default DroppableWrapper;