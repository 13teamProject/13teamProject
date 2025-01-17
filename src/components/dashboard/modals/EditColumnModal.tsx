import { deleteColumn, editColumn, getColumnList } from '@/app/api/columns';
import emitColumns from '@/app/api/pusher/columns/emit';
import Button from '@/components/commons/button';
import Input from '@/components/commons/input';
import Modal from '@/components/commons/modal';
import { useAuthStore } from '@/store/authStore';
import { usePusherStore } from '@/store/pusherStore';
import { Column, EditColumnRequest } from '@planit-types';
import { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  columnData: Column;
  dashboardId: number;
  onColumnDelete: () => void; // 새로 추가된 prop
};

export type EditColumnInputs = {
  columnTitle: string;
};

export default function EditColumnModal({
  columnData,
  dashboardId,
  isOpen,
  onClose,
  onColumnDelete, // 새로 추가된 prop
}: Props) {
  const [columnList, setColumnList] = useState<Column[]>([]);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isValid },
  } = useForm<EditColumnInputs>();
  const inputValue = watch('columnTitle');
  const { socketId } = usePusherStore();
  const { userInfo } = useAuthStore();

  const onSubmit: SubmitHandler<EditColumnInputs> = async ({ columnTitle }) => {
    if (error) return;

    const reqBody: EditColumnRequest = {
      title: columnTitle,
    };

    const res = await editColumn({
      columnId: columnData.id,
      formValue: reqBody,
    });

    if ('message' in res) {
      toast.error(res.message);
      return;
    }

    onClose();
    reset();
    onColumnDelete(); // 컬럼 수정 후 데이터 새로고침
    await emitColumns({
      member: userInfo?.nickname,
      action: 'edit',
      column: columnTitle,
      roomId: String(dashboardId),
      socketId: socketId as string,
    });
  };

  const openDeleteColumnModal = () => {
    setIsDeleteModalOpen(true);
    onClose(); // EditColumnModal을 닫습니다.
  };

  const closeDeleteColumnModal = () => {
    setIsDeleteModalOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      const columnRes = await getColumnList(dashboardId);

      if ('message' in columnRes) {
        toast.error(columnRes.message);
        return;
      }

      setColumnList(columnRes.data);
    })();
  }, [isOpen, dashboardId]);

  useEffect(() => {
    const columnTitleList = columnList.map((column) => column.title);

    if (columnTitleList.includes(inputValue)) {
      setError('중복된 컬럼 이름입니다.');
    } else {
      setError('');
    }
  }, [inputValue, columnList]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <form
          className="w-327 px-20 py-28 md:w-540 md:px-28 md:py-32"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <h1 className="text-20 font-bold dark:text-white md:text-24">
            컬럼 관리
          </h1>

          <label
            htmlFor="columnTitle"
            className="mb-10 mt-24 block text-16 text-black-800 dark:text-white md:mt-32 md:text-18"
          >
            이름
          </label>
          <Input
            id="columnTitle"
            placeholder="컬럼을 입력해 주세요"
            error={!!error}
            register={{ ...register('columnTitle', { required: true }) }}
          />
          <span className="block pt-8 text-14 text-red-500">{error}</span>

          <div className="mt-24 flex flex-col md:mt-28 md:flex-row md:items-end md:justify-between">
            <button
              type="button"
              className="mb-16 cursor-pointer text-left text-14 text-gray-300 underline md:mb-0"
              onClick={openDeleteColumnModal}
            >
              삭제하기
            </button>

            <div className="flex gap-12">
              <Button
                onClick={() => {
                  onClose();
                  reset();
                }}
                styles="py-8 px-54 text-16 md:py-10 md:text-18 md:px-46 md:py-10"
                text="취소"
                cancel
              />
              <Button
                onClick={handleSubmit(onSubmit)}
                styles="py-8 px-54 text-16 md:py-10 md:text-18 md:px-46 md:py-10"
                text="변경"
                disabled={!isValid || !!error}
              />
            </div>
          </div>
        </form>
      </Modal>
      <DeleteColumnModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteColumnModal}
        columnData={columnData}
        dashboardId={dashboardId}
        onColumnDelete={onColumnDelete} // 새로 추가된 prop
      />
    </>
  );
}

function DeleteColumnModal({
  isOpen,
  onClose,
  columnData,
  dashboardId,
  onColumnDelete, // 새로 추가된 prop
}: Props) {
  const { socketId } = usePusherStore();
  const { userInfo } = useAuthStore();
  const handleDeleteColumn = async () => {
    const res = await deleteColumn(columnData.id);

    if ('message' in res) {
      toast.error(res.message);
      return;
    }

    onClose();
    onColumnDelete(); // 컬럼 삭제 후 데이터 새로고침

    await emitColumns({
      member: userInfo?.nickname,
      action: 'delete',
      column: columnData.title,
      roomId: String(dashboardId),
      socketId: socketId as string,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-327 px-20 py-28 md:w-540 md:px-28">
        <h1 className="my-50 text-center md:text-18">
          컬럼의 모든 카드가 삭제됩니다.
        </h1>

        <div className="mt-24 flex gap-12 md:mt-28 md:justify-end">
          <Button
            onClick={onClose}
            styles="py-8 px-54 text-16 md:py-10 md:text-18 md:px-46 md:py-10"
            text="취소"
            cancel
          />
          <Button
            onClick={handleDeleteColumn}
            styles="py-8 px-54 text-16 md:py-10 md:text-18 md:px-46 md:py-10"
            text="삭제"
          />
        </div>
      </div>
    </Modal>
  );
}
