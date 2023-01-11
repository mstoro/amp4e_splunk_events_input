import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit"
import { getApiKeyURL } from "./helpers"
import camelcaseKeys from "camelcase-keys"
import snakecaseKeys from "snakecase-keys"
import { getSplunkHeader } from "../CreateInput/helpers"
import { CONFIG_SAVE_SUCCESS, configURL, saveConfigURL } from "./constants"
import { showInfoMessage } from "../../components/Messages/MessagesSlice"

export const saveAPIKey = createAsyncThunk(
  "saveAPIKey",
  async ({ apiId, apiKey }) => {
    const body = new URLSearchParams({
      ...snakecaseKeys({ apiId, apiKey })
    })

    try {
      await fetch(getApiKeyURL("save_api_key"), {
        method: "POST",
        body,
        headers: getSplunkHeader()
      })
    } catch (e) {
      console.error(e)
    }
  }
)

export const fetchAPIKey = createAsyncThunk("fetchAPIKey", async (apiId) => {
  try {
    return await fetch(getApiKeyURL(`fetch_api_key?api_id=${apiId}`), {
      method: "GET"
    }).then((response) =>
      response.json().then(({ success, api_key }) => success && api_key)
    )
  } catch (e) {
    console.error(e)
  }
})

export const fetchConfig = createAsyncThunk("fetchConfig", () => {
  try {
    return fetch(configURL, {
      method: "GET"
    }).then((response) =>
      response.json().then(({ entry }) => {
        const entryContent = entry[0].content
        entryContent.api_key && saveAPIKey(camelcaseKeys(entryContent))

        return camelcaseKeys(entryContent)
      })
    )
  } catch (e) {
    console.error(e)
  }
})

export const saveConfig = createAsyncThunk(
  "saveConfig",
  async (config, { dispatch }) => {
    const body = new URLSearchParams({
      output_mode: "json",
      ...snakecaseKeys(config),
      api_key: "",
      eai_acl: ""
    })

    try {
      await fetch(saveConfigURL, {
        method: "POST",
        body: body,
        headers: getSplunkHeader()
      })
      dispatch(showInfoMessage(CONFIG_SAVE_SUCCESS))

      return config
    } catch (e) {
      console.error(e)
    }
  }
)

const initialState = {
  data: {},
  pending: false
}

export const configurationSlice = createSlice({
  name: "configuration",
  initialState,
  extraReducers: async (builder) => {
    builder.addMatcher(
      isAnyOf(fetchConfig.pending, fetchAPIKey.pending, saveAPIKey.pending),
      (state) => {
        state.pending = true
      }
    )
    builder.addCase(fetchConfig.fulfilled, (state, { payload }) => {
      state.data = payload
      state.pending = false
    })
    builder.addCase(fetchAPIKey.fulfilled, (state, { payload }) => {
      state.data.apiKey = payload
      state.pending = false
    })
    builder.addCase(saveAPIKey.fulfilled, (state) => {
      state.pending = false
    })
    builder.addCase(saveConfig.fulfilled, (state, { payload }) => {
      state.data = payload
      state.pending = false
    })
  }
})

export default configurationSlice.reducer