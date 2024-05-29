
import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import { mapOrder } from '~/utils/sorts'
import { DndContext, useSensor, useSensors, MouseSensor, TouchSensor, DragOverlay, defaultDropAnimationSideEffects, closestCorners, pointerWithin, rectIntersection, getFirstCollision, closestCenter } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useEffect, useState, useCallback, useRef } from 'react'
import { cloneDeep, isEmpty } from 'lodash'
import { generatePlaceholderCard } from '~/utils/formatter'
import Column from './ListColumns/Column/Column'
import Card from './ListColumns/Column/ListCards/Card/Card'

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
  CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD'
}

function BoardContent({ board }) {
  //Yêu cầu chuột di chuyển 10px thì mới kích hoạt event, click sẽ không làm trigger event
  // const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 10 } })

  //Yêu cầu chuột di chuyển 10px thì mới kích hoạt event, click sẽ không làm trigger event
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 10 } })

  //Nhấn giữ 250ms và dung sai của cảm ứng (500px) thì mới kích hoạt event
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 500 } })

  //Sử dụng kết hợp 2 loại sensor là mouse và touch để có trải nghiệm mobile tốt nhất

  //const sensors = useSensors(pointerSensor)
  const sensors = useSensors(mouseSensor, touchSensor)

  const [orderedColumn, setOrderedColumn] = useState([])

  //Cùng một thời điểm chỉ có một phần tử đang được kéo (column hoặc card)
  const [activeDragItemId, setActiveDragItemId] = useState(null)
  const [activeDragItemType, setActiveDragItemType] = useState(null)
  const [activeDragItemData, setActiveDragItemData] = useState(null)
  const [oldColumnWhenDraggingCard, setOldColumnWhenDraggingCard] = useState(null)

  //Điểm va chạm cuối cùng
  const lastOverId = useRef(null)

  useEffect(() => {
    setOrderedColumn(mapOrder(board?.columns, board?.columnOrderIds, '_id' ))
  }, [board])

  //Tìm một column theo cardId
  const findColumnByCardId = (cardId) => {
    return orderedColumn.find(column => column?.cards?.map(card => card._id)?.includes(cardId))
  }

  //Function xử lí việc cập nhật lại state khi di chuyển card giữa các column khác nhau
  const moveCardBetweenDifferentColumns = (
    overColumn,
    overCardId,
    active,
    over,
    activeColumn,
    activeDraggingCardId,
    activeDraggingCardData
  ) => {
    setOrderedColumn(prevColumns => {
      //Tìm vị trí (index) của cái overCard trong column đích (nơi mà active card sắp được thả)
      const overCardIndex = overColumn?.cards?.findIndex(card => card._id === overCardId)

      //Logic tính toán CardIndex mới (trên hoặc dưới overCard)
      let newCardIndex
      const isBelowOverItem = active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height
      const modifier = isBelowOverItem ? 1 : 0
      newCardIndex = overCardIndex >= 0 ? overCardIndex + modifier : overColumn?.card?.length + 1

      //Clone mảng orderedColumnState cũ ra một cái mới để xử lí data rồi return, cập nhật lại orderedColumnState mới
      const nextColumns = cloneDeep(prevColumns)
      const nextActiveColumn = nextColumns.find(column => column._id === activeColumn._id)
      const nextOverColumn = nextColumns.find(column => column._id === overColumn._id)
      // console.log('nextActiveColumn: ', nextActiveColumn)
      // console.log('nextovercolumn: ', nextOverColumn)

      if (nextActiveColumn) {
        //Xóa card ở cái column active (column cũ)
        nextActiveColumn.cards = nextActiveColumn.cards.filter(card => card._id !== activeDraggingCardId)

        //Thêm placeHolder Card nếu column rỗng
        if (isEmpty(nextActiveColumn.cards)) {
          nextActiveColumn.cards = [generatePlaceholderCard(nextActiveColumn)]
        }

        //Cập nhật lại mảng cardOrderIds
        nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(card => card._id)
      }

      if (nextOverColumn) {
        //Kiểm tra xem card đang kéo nó có tồn tại ở overColumn chưa, nếu có thì phải xóa trước
        nextOverColumn.cards = nextOverColumn.cards.filter(card => card._id !== activeDraggingCardId)

        const rebuild_activeDraggingCardData = {
          ...activeDraggingCardData,
          columnId: nextOverColumn._id
        }

        //Thêm card đang kéo vào overColumn theo vị trí index mới
        nextOverColumn.cards = nextOverColumn.cards.toSpliced(newCardIndex, 0, rebuild_activeDraggingCardData)

        //Xóa placeHolder Card nếu nó tồn tại!
        nextOverColumn.cards = nextOverColumn.cards.filter(card => !card.FE_PlaceholderCard)

        nextOverColumn.cardOrderIds = nextOverColumn.cards.map(card => card._id)
      }

      return nextColumns
    })
  }

  //Trigger khi bắt đầu kéo một phần tử
  const handleDragStart =(event) => {
    // console.log('handleDragStart :', event)
    setActiveDragItemId(event?.active?.id)
    setActiveDragItemType(event?.active?.data?.current?.columnId ? ACTIVE_DRAG_ITEM_TYPE.CARD : ACTIVE_DRAG_ITEM_TYPE.COLUMN)
    setActiveDragItemData(event?.active?.data?.current)

    //Nếu là kéo card thì mới thực hiện hành động set giá trị oldColumn
    if (event?.active?.data?.current?.columnId) {
      setOldColumnWhenDraggingCard(findColumnByCardId(event?.active?.id))
    }
  }

  //Trigger trong quá trình kéo phần tử
  const handleDragOver = (event) => {

    //Không làm gì thêm nếu đang kéo column
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return

    // console.log('handleDragOver: ', event)
    const { active, over } = event

    //Kiểm tran nếu không tồn tại over (kéo linh tinh ra ngoài thì return luôn)
    if (!active || !over) return

    //activeDraggingCard là card đang được kéo, overCard là card đang tương tác ở trên hoặc dưới với card được kéo
    const { id: activeDraggingCardId, data: { current: activeDraggingCardData } } = active
    const { id: overCardId } = over

    //Tìm 2 columns với cardId
    const activeColumn = findColumnByCardId(activeDraggingCardId)
    const overColumn = findColumnByCardId(overCardId)

    if (!activeColumn || !overColumn) return

    //Xử lí logic khi kéo card qua hai column khác nhau, đây là xử lí lúc kéo(handleDragOver)
    if (activeColumn._id !== overColumn._id) {
      moveCardBetweenDifferentColumns(
        overColumn,
        overCardId,
        active,
        over,
        activeColumn,
        activeDraggingCardId,
        activeDraggingCardData
      )
    }
  }

  //Trigger khi kết thúc hành động kéo một phần tử
  const handleDragEnd = (event) => {
    const { active, over } = event

    //Kiểm tran nếu không tồn tại over (kéo linh tinh ra ngoài thì return luôn)
    if (!active || !over) return

    //Xử lí kéo thẻ Card
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {

      //activeDraggingCard là card đang được kéo, overCard là card đang tương tác ở trên hoặc dưới với card được kéo
      const { id: activeDraggingCardId, data: { current: activeDraggingCardData } } = active
      const { id: overCardId } = over

      //Tìm 2 columns với cardId
      const activeColumn = findColumnByCardId(activeDraggingCardId)
      const overColumn = findColumnByCardId(overCardId)

      if (!activeColumn || !overColumn) return

      if (oldColumnWhenDraggingCard._id !== overColumn._id) {
        // console.log('Keo tha card giua 2 column khac nhau')

        moveCardBetweenDifferentColumns(
          overColumn,
          overCardId,
          active,
          over,
          activeColumn,
          activeDraggingCardId,
          activeDraggingCardData
        )

      } else {
        //Kéo thả card trong một column
        //Lấy vị trí cũ từ thằng oldColumnWhenDraggingCard
        const oldCardIndex = oldColumnWhenDraggingCard?.cards?.findIndex(c => c._id === activeDragItemId)
        //Lấy vị trí mới từ thằng over
        const newCardIndex = overColumn.cards.findIndex(c => c._id === overCardId)

        const dndOrderedCards = arrayMove(oldColumnWhenDraggingCard?.cards, oldCardIndex, newCardIndex)
        // console.log('target: ', dndOrderedCards)

        setOrderedColumn(prevColumns => {

          const nextColumns = cloneDeep(prevColumns)

          const targetColumn = nextColumns.find(column => column._id === overColumn._id)

          targetColumn.cards = dndOrderedCards

          targetColumn.cardOrderIds = dndOrderedCards.map(card => card._id)

          //Trả về giá trị mới đúng vị trí
          return nextColumns
        })
      }
    }

    //Xử lí kéo thả column
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      //Nếu vị trí sau khi kéo thả khác với vị trí ban đầu
      if (active.id !== over.id) {
        //Lấy vị trí cũ từ thằng active
        const oldColumnIndex = orderedColumn.findIndex(c => c._id === active.id)
        //Lấy vị trí mới từ thằng over
        const newColumnIndex = orderedColumn.findIndex(c => c._id === over.id)

        const dndOrderedColumns = arrayMove(orderedColumn, oldColumnIndex, newColumnIndex)
        // const dndOrderedColumnsIds = dndOrderedColumns.map(c => c._id)

        //Cập nhật lại state columns ban đầu
        setOrderedColumn(dndOrderedColumns)
      }
    }

    setActiveDragItemId(null)
    setActiveDragItemType(null)
    setActiveDragItemData(null)
    setOldColumnWhenDraggingCard(null)
  }

  const customDropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) 
  }

  const collisionDetectionStrategy = useCallback((args) => {
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      return closestCorners({ ...args })
    }

    const pointerIntersections = pointerWithin(args)

    if (!pointerIntersections?.length) return

    const intersections = pointerIntersections?.length > 0
      ? pointerIntersections
      : rectIntersection(args)

    let overId = getFirstCollision(intersections, 'id')

    if (overId) {
      //Nếu over là một column thì sẽ tìm đến cardId gần nhất trong khu vực va chạm đó bằng thuật toán phát hiện va chạm closestCorners, closestCenters
      const checkColumn = orderedColumn.find(column => column._id === overId)
      if (checkColumn) {
        overId = closestCorners({
          ...args,
          droppableContainers: args.droppableContainers.filter(container => {
            return (container.id !== overId) && (checkColumn?.cardOrderIds.includes(container.id))
          } )
        })[0]?.id
      }

      lastOverId.current = overId
      return [{ id: overId }]
    }

    //Nếu overId là null thì trả về mảng rỗng
    return lastOverId.current ? [{ id: lastOverId.current }] : []

  }, [activeDragItemType, orderedColumn])

  return (
    <DndContext
      sensors={sensors}
      //Thuật toán phát hiện va chạm(thư viện)
      // collisionDetection={closestCorners}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'),
        width: '100%',
        height: (theme) => theme.trello.boardContentHeight,
        p: '10px 0'
      }}>
        <ListColumns columns={orderedColumn} />
        <DragOverlay dropAnimation={customDropAnimation}>
          {!activeDragItemType && null}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) && <Column column={activeDragItemData} /> }
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) && <Card card={activeDragItemData} /> }
        </DragOverlay>
      </Box>
    </DndContext>
  )
}

export default BoardContent