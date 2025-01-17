import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  fetchEventTypes,
  fetchGroups,
  fetchIndexes,
  saveWithAPI
} from "./CreateInputSlice"
import {
  StyledContainer,
  StyledIcon,
  StyledInput,
  StyledSelect,
  StyledSpan
} from "./StyledCreateInput"
import {
  createSelectOptions,
  getNames,
  getSelectedOptions,
  parseIds,
  validateInput
} from "./helpers"
import { hideMessages } from "../../components/Messages/MessagesSlice"
import { fetchInputs, fetchStreams } from "../InputsList/InputListSlice"
import { isEmptyArray } from "formik"
import { NO_CREATE_CAPABILITIES_ERROR } from "./constants"

const CreateInput = () => {
  const dispatch = useDispatch()
  const queryName = new URLSearchParams(window.location.search).get("name")

  const { data: indexes, pending: indexesPending } = useSelector(
    (state) => state.createInput.indexes
  )
  const { data: eventTypes, pending: eventTypesPending } = useSelector(
    (state) => state.createInput.eventTypes
  )
  const { data: groups, pending: groupsPending } = useSelector(
    (state) => state.createInput.groups
  )
  const inputIsSaving = useSelector((state) => state.createInput.pending)
  const inputs = useSelector((state) => state.inputsList.inputs.data)

  const editedInput = useSelector((state) =>
    state.inputsList.inputs?.data?.find(({ name }) => name === queryName)
  )

  const {
    data: { apiId, apiKey, apiHost },
    isAdmin
  } = useSelector((state) => state.configuration)

  const formIsPending = groupsPending || eventTypesPending || indexesPending
  const hasConfigError =
    !apiId ||
    !apiKey ||
    !apiHost ||
    isEmptyArray(eventTypes) ||
    isEmptyArray(groups)

  const [inputName, setInputName] = useState("")
  const [selectedIndex, setSelectedIndex] = useState({ value: "main" })
  const [streamName, setStreamName] = useState("")
  const [selectedEventTypes, setSelectedEventTypes] = useState([])
  const [selectedGroups, setSelectedGroups] = useState([])

  useEffect(() => {
    !isAdmin && alert("You don't have permission to edit this input")
  }, [isAdmin])

  useEffect(() => {
    if (editedInput) {
      setInputName(editedInput.name)
      setSelectedIndex({ value: editedInput?.content.index })
      setStreamName(editedInput.content.stream_name)
      setSelectedEventTypes(parseIds(editedInput.content.event_types))
      setSelectedGroups(parseIds(editedInput.content.groups))
    }
  }, [editedInput])

  useEffect(() => {
    if (apiKey) {
      if (queryName) {
        dispatch(fetchStreams())
      } else {
        dispatch(fetchIndexes())
      }

      dispatch(fetchEventTypes())
      dispatch(fetchGroups())
      dispatch(fetchInputs())
    }
  }, [apiKey, dispatch, queryName])

  const handleSaveBtnClick = (e) => {
    e.stopPropagation()
    dispatch(hideMessages())

    if (validateInput(inputs, inputName, dispatch, !!editedInput)) {
      dispatch(
        saveWithAPI({
          data: {
            name: inputName,
            index: selectedIndex.value,
            stream_name: streamName,
            event_types: selectedEventTypes.join(","),
            groups: selectedGroups.join(","),
            event_types_names: getNames(eventTypes, selectedEventTypes),
            groups_names: getNames(groups, selectedGroups)
          },
          editedInput: editedInput
        })
      )
    }
  }

  return !isAdmin ? (
    <StyledContainer>{NO_CREATE_CAPABILITIES_ERROR}</StyledContainer>
  ) : (
    <StyledContainer>
      {!queryName && (
        <>
          <div className="control-group input_name">
            <label className="control-label">
              Name
              <span className="required">*</span>
            </label>
            <div className="controls">
              <StyledInput
                type="text"
                name="name"
                onChange={(e) => setInputName(e.target.value)}
                disabled={formIsPending || hasConfigError}
              />
              <span className="help-inline"></span>
            </div>
          </div>

          <div className="control-group input_index">
            <label className="control-label">Index</label>
            <div className="controls">
              <StyledSelect
                id="splunkIndexes"
                name="index"
                isDisabled={formIsPending || hasConfigError}
                onChange={(value) => setSelectedIndex(value)}
                options={createSelectOptions(indexes, true)}
                defaultValue={{ option: "main", label: "main" }}
              />
              <span className="help-block">
                In which index would you like the events to appear?
              </span>
            </div>
          </div>
        </>
      )}

      <fieldset>
        <legend>Stream Settings</legend>

        <div className="control-group stream_name">
          <label className="control-label">
            Stream Name
            <span className="required">*</span>
          </label>
          <div className="controls">
            <StyledInput
              type="text"
              name="stream_name"
              disabled={formIsPending || hasConfigError}
              onChange={(e) => setStreamName(e.target.value)}
              value={streamName}
            />
            <span className="help-inline"></span>
          </div>
        </div>

        <div className="control-group stream_event_types">
          <label className="control-label">Event Types</label>
          <StyledSelect
            autosize
            isMulti
            name="event_types"
            components={{
              DropdownIndicator: () => null,
              IndicatorsContainer: () => null
            }}
            isDisabled={formIsPending || hasConfigError}
            onChange={(values) =>
              setSelectedEventTypes(values.map(({ value }) => value))
            }
            placeholder="Leave this field blank to return all Event types"
            options={createSelectOptions(eventTypes)}
            value={getSelectedOptions(eventTypes, selectedEventTypes)}
          />
          <span className="help-inline"></span>
        </div>

        <div className="control-group stream_groups">
          <label className="control-label">Groups</label>
          <div className="controls">
            <StyledSelect
              autosize
              isMulti
              name="groups"
              components={{
                DropdownIndicator: () => null,
                IndicatorsContainer: () => null
              }}
              isDisabled={formIsPending || hasConfigError}
              onChange={(values) =>
                setSelectedGroups(values.map(({ value }) => value))
              }
              placeholder="Leave this field blank to return all Groups"
              options={createSelectOptions(groups)}
              value={getSelectedOptions(groups, selectedGroups)}
            />
            <span className="help-inline"></span>
          </div>
        </div>
      </fieldset>

      <button
        className="btn btn-primary"
        id="save-changes"
        disabled={formIsPending || hasConfigError || inputIsSaving}
        onClick={handleSaveBtnClick}
      >
        {inputIsSaving && <StyledIcon className="icon-clock" />}
        {inputIsSaving ? "Save" : "Saving"}
      </button>
      {inputIsSaving && (
        <StyledSpan>
          Please wait while we setup the AMP for Endpoints streaming resource...
        </StyledSpan>
      )}
    </StyledContainer>
  )
}

export default CreateInput
