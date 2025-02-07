import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import DroppableWrapper from './DroppableWrapper';
import type { Order, Customer } from '../../types';
import type { LucideIcon } from 'lucide-react';

interface DroppableColumnProps {
  dateStr: string;
  type: 'delivery' | 'collection';
  orders: Order[];
  getCustomerById: (id: string) => Customer | undefined;
  icon: LucideIcon;
  title: string;
  onOrderClick: (orderId: string) => void;
}

function DroppableColumn({
  dateStr,
  type,
  orders,
  getCustomerById,
  icon: Icon,
  title,
  onOrderClick
}: DroppableColumnProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Icon className={`h-5 w-5 ${type === 'delivery' ? 'text-blue-500' : 'text-purple-500'}`} />
        <h4 className="font-medium">{title} ({orders.length})</h4>
      </div>

      <DroppableWrapper droppableId={`${dateStr}-${type}`}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[100px] rounded-lg p-2 ${
              snapshot.isDraggingOver ? 'bg-gray-50' : 'bg-gray-100'
            }`}
          >
            {orders.map((order, index) => {
              const customer = getCustomerById(order.customerId);
              return (
                <Draggable key={order.id} draggableId={order.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      onClick={() => onOrderClick(order.id)}
                      className={`mb-2 rounded-lg bg-white p-3 shadow-sm ${
                        snapshot.isDragging ? 'shadow-lg' : ''
                      } ${
                        type === 'delivery' ? 'border-l-4 border-blue-500' : 'border-l-4 border-purple-500'
                      } cursor-pointer hover:bg-gray-50`}
                    >
                      <div className="text-sm font-medium">#{order.id}</div>
                      {customer && (
                        <div className="mt-1 text-sm text-gray-600">
                          {customer.firstName} {customer.lastName}
                          {customer.companyName && (
                            <span className="block text-xs text-gray-500">
                              {customer.companyName}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-500">
                        {order.products.reduce((sum, p) => sum + p.quantity, 0)} items •{' '}
                        ${order.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </DroppableWrapper>
    </div>
  );
}

export default DroppableColumn;