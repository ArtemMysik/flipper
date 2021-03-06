/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  ActiveSheet,
  LauncherMsg,
  ShareType,
  setActiveSheet,
  toggleLeftSidebarVisible,
  toggleRightSidebarVisible,
  ACTIVE_SHEET_SETTINGS,
  ACTIVE_SHEET_DOCTOR,
} from '../reducers/application';
import {
  colors,
  Button,
  ButtonGroup,
  ButtonGroupChain,
  FlexRow,
  Spacer,
  styled,
  Text,
  LoadingIndicator,
} from '../ui';
import {connect} from 'react-redux';
import RatingButton from './RatingButton';
import DevicesButton from './DevicesButton';
import {LocationsButton} from './LocationsButton';
import ScreenCaptureButtons from './ScreenCaptureButtons';
import UpdateIndicator from './UpdateIndicator';
import config from '../fb-stubs/config';
import {clipboard} from 'electron';
import React from 'react';
import {State} from '../reducers';
import {reportUsage} from '../utils/metrics';
import MetroButton from './MetroButton';
import {navPluginStateSelector} from './LocationsButton';
import {getVersionString} from '../utils/versionString';

const AppTitleBar = styled(FlexRow)<{focused?: boolean}>(({focused}) => ({
  userSelect: 'none',
  background: focused
    ? `linear-gradient(to bottom, ${colors.macOSTitleBarBackgroundTop} 0%, ${colors.macOSTitleBarBackgroundBottom} 100%)`
    : colors.macOSTitleBarBackgroundBlur,
  borderBottom: `1px solid ${
    focused ? colors.macOSTitleBarBorder : colors.macOSTitleBarBorderBlur
  }`,
  height: 38,
  flexShrink: 0,
  width: '100%',
  alignItems: 'center',
  paddingLeft: 80,
  paddingRight: 10,
  justifyContent: 'space-between',
  WebkitAppRegion: 'drag',
  zIndex: 6,
}));

type OwnProps = {
  version: string;
};

type DispatchFromProps = {
  toggleLeftSidebarVisible: (visible?: boolean) => void;
  toggleRightSidebarVisible: (visible?: boolean) => void;
  setActiveSheet: (sheet: ActiveSheet) => void;
};

type StateFromProps = {
  windowIsFocused: boolean;
  leftSidebarVisible: boolean;
  rightSidebarVisible: boolean;
  rightSidebarAvailable: boolean;
  downloadingImportData: boolean;
  launcherMsg: LauncherMsg;
  share: ShareType | null | undefined;
  navPluginIsActive: boolean;
};

const VersionText = styled(Text)({
  color: colors.light50,
  marginLeft: 4,
  marginTop: 2,
  cursor: 'pointer',
  display: 'block',
  padding: '4px 10px',
  '&:hover': {
    backgroundColor: `rgba(0,0,0,0.05)`,
    borderRadius: '999em',
  },
});

export class Version extends React.Component<
  {children: string},
  {copied: boolean}
> {
  state = {
    copied: false,
  };
  _onClick = () => {
    clipboard.writeText(this.props.children);
    this.setState({copied: true});
    setTimeout(() => this.setState({copied: false}), 1000);
  };

  render() {
    return (
      <VersionText onClick={this._onClick}>
        {this.state.copied ? 'Copied' : this.props.children}
      </VersionText>
    );
  }
}

const Importing = styled(FlexRow)({
  color: colors.light50,
  alignItems: 'center',
  marginLeft: 10,
});

function statusMessageComponent(
  downloadingImportData: boolean,
  statusComponent?: React.ReactNode | undefined,
) {
  if (downloadingImportData) {
    return (
      <Importing>
        <LoadingIndicator size={16} />
        &nbsp;Importing data...
      </Importing>
    );
  }
  if (statusComponent) {
    return statusComponent;
  }
  return;
}

type Props = OwnProps & DispatchFromProps & StateFromProps;
class TitleBar extends React.Component<Props, StateFromProps> {
  render() {
    const {navPluginIsActive, share} = this.props;
    return (
      <AppTitleBar focused={this.props.windowIsFocused} className="toolbar">
        {navPluginIsActive ? (
          <ButtonGroupChain iconSize={12}>
            <DevicesButton />
            <LocationsButton />
          </ButtonGroupChain>
        ) : (
          <DevicesButton />
        )}

        <MetroButton />

        <ScreenCaptureButtons />
        {statusMessageComponent(
          this.props.downloadingImportData,
          share != null ? share.statusComponent : undefined,
        )}
        <Spacer />

        {config.showFlipperRating ? <RatingButton /> : null}
        <Version>{getVersionString()}</Version>

        <UpdateIndicator />

        <Button
          icon="settings"
          title="Settings"
          compact={true}
          onClick={() => {
            this.props.setActiveSheet(ACTIVE_SHEET_SETTINGS);
            reportUsage('settings:opened:fromTitleBar');
          }}
        />
        <Button
          icon="first-aid"
          title="Doctor"
          compact={true}
          onClick={() => {
            this.props.setActiveSheet(ACTIVE_SHEET_DOCTOR);
            reportUsage('doctor:report:opened:fromTitleBar');
          }}
        />
        <ButtonGroup>
          <Button
            compact={true}
            selected={this.props.leftSidebarVisible}
            onClick={() => this.props.toggleLeftSidebarVisible()}
            icon="icons/sidebar_left.svg"
            iconSize={20}
            title="Toggle Plugins"
          />
          <Button
            compact={true}
            selected={this.props.rightSidebarVisible}
            onClick={() => this.props.toggleRightSidebarVisible()}
            icon="icons/sidebar_right.svg"
            iconSize={20}
            title="Toggle Details"
            disabled={!this.props.rightSidebarAvailable}
          />
        </ButtonGroup>
      </AppTitleBar>
    );
  }
}

export default connect<StateFromProps, DispatchFromProps, OwnProps, State>(
  (state) => {
    const {
      application: {
        windowIsFocused,
        leftSidebarVisible,
        rightSidebarVisible,
        rightSidebarAvailable,
        downloadingImportData,
        launcherMsg,
        share,
      },
    } = state;
    const navPluginIsActive = !!navPluginStateSelector(state);

    return {
      windowIsFocused,
      leftSidebarVisible,
      rightSidebarVisible,
      rightSidebarAvailable,
      downloadingImportData,
      launcherMsg,
      share,
      navPluginIsActive,
    };
  },
  {
    setActiveSheet,
    toggleLeftSidebarVisible,
    toggleRightSidebarVisible,
  },
)(TitleBar);
