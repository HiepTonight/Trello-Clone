import axios from 'axios'
import {API_ROOT} from '~/utils/constants'

//Catch lỗi tập trung tại Intercepters

export const fetchBoardDetailAPI = async (boardId) => {
  const response = await axios.get(`http://localhost:8888/api/v1/boards/${boardId}`)

  return response.data
}