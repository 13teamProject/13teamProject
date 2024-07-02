'use client';

import { getCards } from '@/app/api/getCards';
import { Column as ColumnType, getColumns } from '@/app/api/getColumns';
import BarButton from '@/components/commons/button/BarButton';
import ColorCircle from '@/components/commons/circle/ColorCircle';
import { GetCardResponse } from '@planit-types';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import Card from '../cards/Card';

type ColumnProps = {
  dashboardId: number;
};

type ColumnWithCards = ColumnType & {
  cards: GetCardResponse[];
};

export default function Column({ dashboardId }: ColumnProps) {
  const [columns, setColumns] = useState<ColumnWithCards[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchColumnsAndCards() {
      try {
        const columnsData = await getColumns({ dashboardId });

        const columnsWithCards = await Promise.all(
          columnsData.map(async (column) => {
            const cards = await getCards({ columnId: column.id });
            return { ...column, cards };
          }),
        );

        setColumns(columnsWithCards);
      } catch (err) {
        setError('데이터 불러오는 중 에러 발생!');
      } finally {
        setLoading(false);
      }
    }

    fetchColumnsAndCards();
  }, [dashboardId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="w-full lg:flex lg:h-full lg:overflow-hidden">
      {columns.map((column) => (
        <div
          key={column.id}
          className="w-full px-20 sm:border-b sm:p-12 md:border-r md:p-20 lg:flex lg:h-full lg:flex-col"
        >
          <div className="my-20 flex w-full items-center justify-between">
            <div className="flex items-center justify-center gap-4">
              <ColorCircle size="sm" color="bg-toss-blue" />
              <h1 className="text-16 font-bold md:text-18">{column.title}</h1>
              <span className="inline-flex h-20 w-20 items-center justify-center rounded-4 bg-gray-200 text-12 text-gray-400">
                {column.cards.length}
              </span>
            </div>
            <Image
              src="/icon/settings.svg"
              alt="setting"
              width={22}
              height={22}
              className="cursor-pointer transition duration-500 ease-in-out hover:rotate-45"
            />
          </div>
          <BarButton />
          <div className="sm:mb-12 md:mb-20 lg:flex-1 lg:overflow-y-auto">
            {column.cards.map((card) => (
              <Card key={card.id} cardId={card.id} columnTitle={column.title} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
